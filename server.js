const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Maak /tmp bereikbaar als publieke map zodat Zernio de video kan downloaden
app.use('/videos', express.static('/tmp'));

app.post('/generate', (req, res) => {
    const imageUrl = req.body.imageUrl;
    if (!imageUrl) return res.status(400).send('Image URL missing');

    const outputFileName = `video_${Date.now()}.mp4`;
    const outputPath = path.join('/tmp', outputFileName);

    const cmd = `ffmpeg -loop 1 -i "${imageUrl}" -c:v libx264 -preset ultrafast -tune stillimage -t 4 -pix_fmt yuv420p -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2" -r 30 "${outputPath}"`;
    
    exec(cmd, (error) => {
        if (error) return res.status(500).send(error.message);

        // Geef een JSON-object terug met de publieke URL voor Zernio
        const videoUrl = `https://${req.get('host')}/videos/${outputFileName}`;
        res.json({ videoUrl });

        // Ruim het bestand na 60 seconden op (zodat Zernio tijd heeft om te downloaden)
        setTimeout(() => {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }, 60000);
    });
});

app.listen(3000, () => console.log('Video service running on port 3000'));
