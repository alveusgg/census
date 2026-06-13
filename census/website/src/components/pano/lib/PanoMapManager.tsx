import * as THREE from 'three';

export interface PanoTileLevel {
  id: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  rows: number;
  showBelowFov: number;
  tiles: string[][];
}

export interface PanoTileManifest {
  projection: 'equirectangular';
  base: {
    src: string;
    width: number;
    height: number;
  };
  levels: PanoTileLevel[];
}

interface PanoMapManagerParams {
  manifest: PanoTileManifest;
}

interface PanoMapManagerOptions {
  baseCanvasWidth: number;
  radius: number;
  tileRadiusOffset: number;
  preloadTileMargin: number;
  tilePatchSegments: number;
}

interface TileDescriptor {
  level: PanoTileLevel;
  column: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TileRecord {
  mesh?: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  promise?: Promise<void>;
  disposed: boolean;
  visibleWanted: boolean;
}

export const defaultPanoMapManagerOptions: PanoMapManagerOptions = {
  baseCanvasWidth: 4096,
  radius: 10,
  tileRadiusOffset: 0.025,
  preloadTileMargin: 0,
  tilePatchSegments: 10
};

const TILE_VISIBILITY_SAMPLE_COUNT = 5;
const VIEWPORT_UV_SAMPLE_COUNT = 5;
const UV_EDGE_EPSILON = 1e-6;

export class PanoMapManager {
  texture: THREE.CanvasTexture<OffscreenCanvas>;
  camera: THREE.PerspectiveCamera;
  canvas: OffscreenCanvas;
  tileRoot: THREE.Group;
  params: PanoMapManagerParams;

  startup: Promise<void>;

  private readonly options: PanoMapManagerOptions;
  private readonly context: OffscreenCanvasRenderingContext2D;
  private readonly tiles = new Map<string, TileRecord>();

  constructor(params: PanoMapManagerParams, options: PanoMapManagerOptions) {
    this.params = params;
    this.options = options;

    const baseWidth = Math.min(params.manifest.base.width, options.baseCanvasWidth);
    const baseHeight = Math.round(baseWidth / 2);

    this.canvas = new OffscreenCanvas(baseWidth, baseHeight);
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Failed to get canvas context');
    this.context = context;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    this.tileRoot = new THREE.Group();
    this.tileRoot.name = 'PanoMapTiles';
    this.tileRoot.scale.set(-1, 1, 1);

    this.camera = new THREE.PerspectiveCamera(45, 2 / 1, 0.1, 1000);
    this.camera.position.set(0, 0, 0);
    this.camera.fov = 60;

    this.startup = this.init();
  }

  public async init() {
    const image = await loadImage(this.params.manifest.base.src);
    this.context.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
    this.texture.needsUpdate = true;
  }

  public update(camera: THREE.Camera) {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const targetLevel = this.getTargetLevel(camera.fov);
    if (!targetLevel) {
      this.disposeAllTiles();
      return;
    }

    const levelsToRender = this.params.manifest.levels.filter(level => level.width <= targetLevel.width);
    const visibleKeys = new Set<string>();

    for (const level of levelsToRender) {
      for (const descriptor of getVisibleTiles(camera, level, this.options.preloadTileMargin)) {
        const key = getTileKey(descriptor);
        visibleKeys.add(key);
        this.ensureTile(descriptor, levelsToRender.indexOf(level));
      }
    }

    for (const [key, record] of this.tiles) {
      const visible = visibleKeys.has(key);
      if (!visible) {
        this.disposeTile(key, record);
        continue;
      }

      record.visibleWanted = visible;
      if (record.mesh) record.mesh.visible = visible;
    }
  }

  public dispose() {
    for (const record of this.tiles.values()) {
      record.mesh?.geometry.dispose();
      record.mesh?.material.map?.dispose();
      record.mesh?.material.dispose();
    }

    this.disposeAllTiles();
    this.texture.dispose();
  }

  private getTargetLevel(fov: number) {
    return this.params.manifest.levels
      .filter(level => fov <= level.showBelowFov)
      .sort((a, b) => a.width - b.width)
      .at(-1);
  }

  private disposeAllTiles() {
    for (const [key, record] of Array.from(this.tiles)) {
      this.disposeTile(key, record);
    }
  }

  private disposeTile(key: string, record: TileRecord) {
    record.disposed = true;
    record.visibleWanted = false;

    if (record.mesh) {
      this.tileRoot.remove(record.mesh);
      record.mesh.geometry.dispose();
      record.mesh.material.map?.dispose();
      record.mesh.material.dispose();
    }

    this.tiles.delete(key);
  }

  private ensureTile(descriptor: TileDescriptor, renderOrder: number) {
    const key = getTileKey(descriptor);
    const existing = this.tiles.get(key);
    if (existing) {
      existing.visibleWanted = true;
      if (existing.mesh) existing.mesh.visible = true;
      return;
    }

    const record: TileRecord = {
      disposed: false,
      visibleWanted: true
    };
    this.tiles.set(key, record);

    record.promise = loadImage(getTileUrl(descriptor))
      .then(image => {
        if (record.disposed) return;

        const geometry = createTileGeometry(
          descriptor,
          this.options.radius - this.options.tileRadiusOffset,
          this.options.tilePatchSegments
        );
        const texture = new THREE.Texture(image);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.needsUpdate = true;

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide,
          depthWrite: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = key;
        mesh.renderOrder = renderOrder + 1;
        mesh.visible = record.visibleWanted;

        if (record.disposed) {
          geometry.dispose();
          material.map?.dispose();
          material.dispose();
          return;
        }

        record.mesh = mesh;
        this.tileRoot.add(mesh);
      })
      .catch(() => {
        if (this.tiles.get(key) === record) this.tiles.delete(key);
      });
  }
}

export function getVisibleTiles(camera: THREE.PerspectiveCamera, level: PanoTileLevel, preloadTileMargin: number) {
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  const viewportMargin = Math.max(0, preloadTileMargin);
  const viewportUvSamples = getViewportUvSamples(camera);
  const descriptors: TileDescriptor[] = [];

  for (let column = 0; column < level.columns; column++) {
    for (let row = 0; row < level.rows; row++) {
      const descriptor = createTileDescriptor(level, column, row);
      if (isTileVisible(camera, descriptor, viewportMargin, viewportUvSamples)) {
        descriptors.push(descriptor);
      }
    }
  }

  return descriptors;
}

function createTileDescriptor(level: PanoTileLevel, column: number, row: number): TileDescriptor {
  const x = column * level.tileWidth;
  const y = row * level.tileHeight;

  return {
    level,
    column,
    row,
    x,
    y,
    width: Math.min(level.tileWidth, level.width - x),
    height: Math.min(level.tileHeight, level.height - y)
  };
}

function createTileGeometry(descriptor: TileDescriptor, radius: number, patchSegments: number) {
  const u0 = descriptor.x / descriptor.level.width;
  const u1 = (descriptor.x + descriptor.width) / descriptor.level.width;
  const v0 = descriptor.y / descriptor.level.height;
  const v1 = (descriptor.y + descriptor.height) / descriptor.level.height;
  const widthSegments = Math.max(2, patchSegments);
  const heightSegments = Math.max(2, Math.ceil(patchSegments * (descriptor.height / descriptor.width)));
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= heightSegments; y++) {
    const localV = y / heightSegments;
    const globalV = THREE.MathUtils.lerp(v0, v1, localV);
    const theta = globalV * Math.PI;

    for (let x = 0; x <= widthSegments; x++) {
      const localU = x / widthSegments;
      const globalU = THREE.MathUtils.lerp(u0, u1, localU);
      const phi = globalU * Math.PI * 2;
      const sinTheta = Math.sin(theta);

      positions.push(-radius * Math.cos(phi) * sinTheta, radius * Math.cos(theta), radius * Math.sin(phi) * sinTheta);
      uvs.push(localU, 1 - localV);
    }
  }

  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = y * (widthSegments + 1) + x;
      const b = a + widthSegments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function isTileVisible(
  camera: THREE.PerspectiveCamera,
  descriptor: TileDescriptor,
  viewportMargin: number,
  viewportUvSamples: THREE.Vector2[]
) {
  for (const uv of getTileUvSamples(descriptor, TILE_VISIBILITY_SAMPLE_COUNT)) {
    if (isWorldPointInCameraView(uvToWorldPoint(uv, camera.far * 0.5), camera, viewportMargin)) {
      return true;
    }
  }

  return viewportUvSamples.some(uv => isUvInTile(uv, descriptor));
}

function getTileUvSamples(descriptor: TileDescriptor, samples: number) {
  const u0 = descriptor.x / descriptor.level.width;
  const u1 = (descriptor.x + descriptor.width) / descriptor.level.width;
  const v0 = descriptor.y / descriptor.level.height;
  const v1 = (descriptor.y + descriptor.height) / descriptor.level.height;
  const uvs: THREE.Vector2[] = [];

  for (let y = 0; y < samples; y++) {
    for (let x = 0; x < samples; x++) {
      uvs.push(
        new THREE.Vector2(
          THREE.MathUtils.lerp(u0, u1, x / (samples - 1)),
          THREE.MathUtils.lerp(v0, v1, y / (samples - 1))
        )
      );
    }
  }

  return uvs;
}

function getViewportUvSamples(camera: THREE.PerspectiveCamera) {
  const uvs: THREE.Vector2[] = [];

  for (let y = 0; y < VIEWPORT_UV_SAMPLE_COUNT; y++) {
    for (let x = 0; x < VIEWPORT_UV_SAMPLE_COUNT; x++) {
      const ndcX = -1 + (2 * x) / (VIEWPORT_UV_SAMPLE_COUNT - 1);
      const ndcY = -1 + (2 * y) / (VIEWPORT_UV_SAMPLE_COUNT - 1);
      const direction = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize();
      uvs.push(directionToEquirectangularUv(direction));
    }
  }

  return uvs;
}

function isWorldPointInCameraView(point: THREE.Vector3, camera: THREE.PerspectiveCamera, margin: number) {
  const projected = point.clone().project(camera);

  return (
    Number.isFinite(projected.x) &&
    Number.isFinite(projected.y) &&
    Number.isFinite(projected.z) &&
    projected.z >= -1 &&
    projected.z <= 1 &&
    Math.abs(projected.x) <= 1 + margin &&
    Math.abs(projected.y) <= 1 + margin
  );
}

function uvToWorldPoint(uv: THREE.Vector2, radius: number) {
  const theta = uv.y * Math.PI;
  const phi = uv.x * Math.PI * 2;
  const sinTheta = Math.sin(theta);

  return new THREE.Vector3(
    radius * Math.cos(phi) * sinTheta,
    radius * Math.cos(theta),
    radius * Math.sin(phi) * sinTheta
  );
}

function directionToEquirectangularUv(direction: THREE.Vector3) {
  const localDirection = new THREE.Vector3(-direction.x, direction.y, direction.z).normalize();
  const phi = THREE.MathUtils.euclideanModulo(Math.atan2(localDirection.z, -localDirection.x), Math.PI * 2);
  const theta = Math.acos(THREE.MathUtils.clamp(localDirection.y, -1, 1));

  return new THREE.Vector2(phi / (Math.PI * 2), theta / Math.PI);
}

function isUvInTile(uv: THREE.Vector2, descriptor: TileDescriptor) {
  const u = normalize01(uv.x);
  const v = THREE.MathUtils.clamp(uv.y, 0, 1);
  const u0 = descriptor.x / descriptor.level.width;
  const u1 = (descriptor.x + descriptor.width) / descriptor.level.width;
  const v0 = descriptor.y / descriptor.level.height;
  const v1 = (descriptor.y + descriptor.height) / descriptor.level.height;

  return (
    u >= u0 - UV_EDGE_EPSILON &&
    u <= u1 + UV_EDGE_EPSILON &&
    v >= v0 - UV_EDGE_EPSILON &&
    v <= v1 + UV_EDGE_EPSILON
  );
}

function getTileKey(descriptor: TileDescriptor) {
  return `${descriptor.level.id}:${descriptor.column}:${descriptor.row}`;
}

function getTileUrl(descriptor: TileDescriptor) {
  const url = descriptor.level.tiles[descriptor.row]?.[descriptor.column];
  if (!url) throw new Error(`Missing pano tile URL: ${descriptor.level.id}/${descriptor.row}/${descriptor.column}`);

  return url;
}

function normalize01(value: number) {
  return THREE.MathUtils.euclideanModulo(value, 1);
}

async function loadImage(src: string) {
  const image = new Image();
  image.decoding = 'async';
  image.src = src;

  if (image.decode) {
    await image.decode();
    return image;
  }

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
  });

  return image;
}
