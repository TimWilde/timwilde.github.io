const audio = document.querySelector('audio')
const trackSources = document.querySelectorAll('audio source')
const firstSource = trackSources[0]
const tracks = Array.from(trackSources).map(x => ({ src: x.src, from: x.dataset.from }))
const playing = document.querySelector('#playing a')

let played = 0

const decode = uri => {
   const lastSlash = uri.lastIndexOf('/') + 1
   const lastDot = uri.lastIndexOf('.')
   return decodeURI(uri.substring(lastSlash, lastDot)).split('-').map(x => x.trim())
}

const player = document.getElementById('music')
player.addEventListener('ended', () => {
   played += 1
   const nextTrack = tracks[played % tracks.length]
   firstSource.src = nextTrack.src
   music.load()
   music.play()

   const [author, track] = decode(nextTrack.src)

   playing.textContent = `${track} by ${author}`
   playing.href = nextTrack.from
})

const mute = () => {
   audio.muted = !audio.muted
}

document.addEventListener('keydown', e => {
   switch (e.key) {
      case 'm':
         mute()
         break;
      case '-':
         audio.volume = Math.max(0, audio.volume - 0.1)
         break;
      case '=':
      case '+':
         audio.volume = Math.min(1, audio.volume + 0.1)
         break;
      default:
         break;
   }
})