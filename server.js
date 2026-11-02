const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

app.post('/generate', (req, res) => {
    const imageUrl = req.body.imageUrl;
    if (!imageUrl) return res.status(400).send('Image URL missing');

    const outputFileName = `video_${Date.now()}.mp4`;
    const outputPath = path.join('/tmp', outputFileName);

    // FFmpeg commando: maakt een verticale 1080x1920 video van 4 seconden op basis van de afbeeldings-URL
    const cmd = `ffmpeg -loop 1 -i "${imageUrl}" -c:v libx264 -t 4 -pix_fmt yuv420p -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -r 30 "${outputPath}"`;

    exec(cmd, (error) => {
        if (error) return res.status(500).send(error.message);
        res.sendFile(outputPath, (err) => {
            if (!err) {
                // Bestand opruimen na verzenden
                setTimeout(() => {
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                }, 5000);
            }
        });
    });
});

app.listen(3000, () => console.log('Video service running on port 3000'));