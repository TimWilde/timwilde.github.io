(async function (document) {
   const response = await fetch('/tag-data.json')
   const tags = (await response.json()).tags

   const colors = chroma
      .cubehelix()
      .start(100)
      .rotations(0.80)
      .gamma(1.25)
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

   const pageTags = document.querySelectorAll('a[data-tag],h2[data-tag]')
   for (const tagEl of pageTags) {
      tagEl.style.backgroundColor = tagColors[tagEl.dataset.tag].background
      tagEl.style.borderColor = tagColors[tagEl.dataset.tag].border
   }
})(document)