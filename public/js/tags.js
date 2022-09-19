(async function (document) {
   const response = await fetch('/tag-data.json')
   const tags = (await response.json()).tags

   const colors = chroma
      .cubehelix()
      .start(200)
      .rotations(1)
      .gamma(1.5)
      .lightness([0.6, 0.8])
      .scale()
      .colors(tags.length);

   const tagColors = {}
   for (let index = 0; index < tags.length; index++) {
      const background = chroma(colors[index]).saturate(2).alpha(0.2)
      tagColors[tags[index]] = {
         background: background,
         border: background.darken()
      }
   }

   const pageTags = document.querySelectorAll('[data-tag]')
   for (const tagEl of pageTags) {
      tagEl.style.backgroundColor = tagColors[tagEl.dataset.tag].background
      tagEl.style.borderColor = tagColors[tagEl.dataset.tag].border
   }
})(document)