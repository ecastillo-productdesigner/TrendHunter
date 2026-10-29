"""Encode the second feed image as a seamless five-second pan/zoom MP4.

Requires FFmpeg with libx264. No soundtrack is added to the photo animation.
"""
import argparse
from pathlib import Path
import shutil
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg'))
args = parser.parse_args()
if not args.ffmpeg:
    parser.error('Provide --ffmpeg /path/to/ffmpeg')
root = Path(__file__).resolve().parents[1]
source = root / 'site/assets/feed/trend-02.png'
output = root / 'site/assets/feed/trend-02-loop.mp4'
motion = ("scale=1576:886,zoompan="
          "z='1.02+0.025*(1-cos(2*PI*on/150))':"
          "x='iw/2-iw/zoom/2+6*sin(2*PI*on/150)':"
          "y='ih/2-ih/zoom/2':d=150:s=788x442:fps=30")
subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
                '-i', str(source), '-vf', motion, '-frames:v', '150', '-an',
                '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
                '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(output)], check=True)
print(f'Created {output.name}: 150 frames, 30 fps, 5 seconds, {output.stat().st_size} bytes')
