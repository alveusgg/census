### Long running operations

If you are performing any long running tasks like processing an image, downloading a video, waiting on an external service, etc, you should wrap that in the `runLongOperation` function.

It’s especially important if this task occurs outside of the request lifetime, e.g if it continues after a request is completed or if it’s triggered by a timer or event.

This prevents the application from shutting down until it's completed, which could happen at any point if a new version of the api is deployed. It also logs information about that specific operation.
