from pydub import AudioSegment
import sys

if len(sys.argv) < 2:
    print('Too less arguments, at least one')
    exit(-1)

path = str(sys.argv[1])

opath = path[0: path.rindex('.')]

song = AudioSegment.from_file(path)

song = song.set_channels(2)

songs = song.split_to_mono()
songs[0] = songs[0].apply_gain_stereo(0, -100)
songs[1] = songs[1].apply_gain_stereo(-100, 0)
songs[0].export(opath + '-L.mp3')
songs[1].export(opath + '-R.mp3')

