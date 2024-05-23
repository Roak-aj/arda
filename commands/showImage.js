const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gifuct-js');

const showImage = async (message) => {
  try {
    const canvas = createCanvas(1200, 600);
    const ctx = canvas.getContext('2d');

    const image1 = await loadImage('https://i.postimg.cc/jjyJR7Gd/hobbit-bounders.jpg');
    const middleImage = await loadImage('https://i.pinimg.com/originals/2e/99/f7/2e99f7161833110b02141a7c1e47d5e7.png');
    const image2 = await loadImage('https://i.postimg.cc/26wCCQrY/lobelia-sackville-baggins.jpg');
    // const gifImage = await loadGIF('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHVrOWZxand5cWN4NHh2aHA1Zzc1NmQzNW4wczR6bzc0ZW1hbjVtYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/CyeGh5u6xmhgY/giphy.gif');
  

    ctx.drawImage(image1, 0, 0, 500, 500);
    ctx.drawImage(middleImage, 500, 200, 200, 200);
    // ctx.drawImage(gifImage, 550, 150);  Draw the GIF in the middle
    ctx.drawImage(image2, 700, 0, 500, 500);

    // Change text color (example: red)
    // ctx.fillStyle = 'red';
    // ctx.font = '48px sans-serif';
    // ctx.fillText('Text', 550, 300);

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'custom-image.png' });
    const embed = new EmbedBuilder()
      .setTitle('Combined Images')
      .setImage('attachment://custom-image.png');

    message.channel.send({ embeds: [embed], files: [attachment] });
  } catch (error) {
    console.error('Error showing combined images:', error);
    message.reply('An error occurred while showing the combined images.');
  }
};

async function loadGIF(gifUrl) {
  const gifData = await fetch(gifUrl).then(res => res.arrayBuffer());
  const gif = GIFEncoder.parseGIF(new Uint8Array(gifData));
  const canvas = createCanvas(gif.width, gif.height);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(gif.width, gif.height);
  gif.decompressAnimation();
  gif.displayCurrentFrame(imageData.data);
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

module.exports = showImage;

