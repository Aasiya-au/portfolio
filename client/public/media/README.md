# Project media

Each project has its own folder: `projects/<project-id>/`

Put files there, then list their names in `content/projects.json`:

    "media": {
      "cover": "cover.jpg",              // main thumbnail
      "images": ["shot-1.jpg", "shot-2.jpg"],
      "video": "demo.mp4",               // small local clip (optional)
      "video_url": "https://youtu.be/..."  // or a YouTube / itch.io link (optional)
    }

Tips
- Screenshots: .jpg or .webp, about 1600px wide, under 500 KB each.
- Videos: keep local clips under ~20 MB (10-30 seconds). Longer ones go on YouTube.
- The site will read them from /media/projects/<project-id>/<filename>.
