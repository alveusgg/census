# Encrypted images

A weird quirk of wanting to develop this project in the open & not spoil the fun of the census is that we need a way to store images & information about -

In the website directory, run `pnpm run images:process` to process a source directory of png images into a target directory of encrypted png images & svg silhouettes.

This creates a manifest.json file in the source directory that contains all the information we need to use these images as stickers for Dr. Allison’s Shiny Bugs.

The other part of this process is the service worker that is used to decrypt the images on the client side. This is located in the website directory at `service-worker.ts`.

When the user visits the site, the service worker intercepts requests for encrypted images & decrypts them on the fly. This is a little odd but it stops us from having a side-channel for uploading images into object storage and then referencing them in the database. It all gets deployed by the normal process of uploading assets to the website.
