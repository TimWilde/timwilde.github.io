(async (document) => {
   const tagFilters = document.querySelectorAll('a[data-tag]');
   const tagSections = document.querySelectorAll('section[data-tag]')
   const clearFilter = document.querySelector('.filter button')

   const resetFilters = (filters) => {
      for(const filter of filters) {
         filter.dataset.selected = false
      }
   }

   const refreshVisibility = (filters) => {
      const selectedTags = []

      for (const filter of filters) {
         if (filter.dataset.selected === 'true')
            selectedTags.push(filter.dataset.tag)
      }

      if (selectedTags.length === 0) {
         for (const filter of filters) {
            filter.dataset.enabled = true
         }

         for (const section of tagSections) {
            section.dataset.enabled = true
         }

         document.querySelector('div.filter').dataset.enabled = false

         return
      }

      document.querySelector('div.filter').dataset.enabled = true

      const otherTags = []

      for (const section of tagSections) {
         const isActive = selectedTags.includes(section.dataset.tag)
         section.dataset.enabled = isActive

         if (isActive) {
            const sectionLinks = section.querySelectorAll('a[data-tags]')

            for (const link of sectionLinks) {
               const tags = link.dataset.tags.split(',')

               for (const tag of tags) {
                  if (otherTags.includes(tag)) continue
                  otherTags.push(tag)
               }
            }
         }
      }

      for (const filter of filters) {
         filter.dataset.enabled = otherTags.includes(filter.dataset.tag)
      }
   }

   const filterTags = e => {
      e.preventDefault()

      const isSelected = e.target.dataset.selected === 'true'
      e.target.dataset.selected = !isSelected

      refreshVisibility(tagFilters);
   }

   const clearFilters = e => {
      e.preventDefault()

      resetFilters(tagFilters)
      refreshVisibility(tagFilters)
   }

   for (const filter of tagFilters) {
      filter.dataset.selected = false
      filter.addEventListener('click', filterTags)
   }

   clearFilter.addEventListener('click', clearFilters)
})(document)