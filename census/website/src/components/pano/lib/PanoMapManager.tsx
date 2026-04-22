import * as THREE from 'three';

interface PanoMapManagerParams {
  pano: {
    low: string;
    high: string;
  };
}

interface PanoMapManagerOptions {
  resolution: number;
}

export const defaultPanoMapManagerOptions: PanoMapManagerOptions = {
  resolution: 8192
};

export class PanoMapManager {
  texture: THREE.CanvasTexture<OffscreenCanvas>;
  camera: THREE.PerspectiveCamera;
  canvas: OffscreenCanvas;
  params: PanoMapManagerParams;

  startup: Promise<void>;
  constructor(params: PanoMapManagerParams, options: PanoMapManagerOptions) {
    this.params = params;
    // Always 2:1 aspect ratio
    this.canvas = new OffscreenCanvas(options.resolution * 2, options.resolution);
    this.texture = new THREE.CanvasTexture(this.canvas);

    this.camera = new THREE.PerspectiveCamera(45, 2 / 1, 0.1, 1000);
    this.camera.position.set(0, 0, 0);
    this.camera.fov = 60;

    this.startup = this.init();
  }

  public async init() {
    const lowResolutionImage = new Image();
    await new Promise<void>(resolve => {
      lowResolutionImage.onload = () => resolve();
      lowResolutionImage.src = this.params.pano.low;
    });

    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Failed to get canvas context');
    context.drawImage(lowResolutionImage, 0, 0, this.canvas.width, this.canvas.height);

    const highResolutionImage = new Image();
    new Promise<void>(resolve => {
      highResolutionImage.onload = () => resolve();
      highResolutionImage.src = this.params.pano.high;
    }).then(() => {
      context.drawImage(highResolutionImage, 0, 0, this.canvas.width, this.canvas.height);
      this.texture.needsUpdate = true;
    });

    this.texture.needsUpdate = true;
  }
}
