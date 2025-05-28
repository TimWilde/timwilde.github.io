<%*
const slug = await tp.system.prompt("Category Slug")
const title = await tp.system.prompt("Category Title")
await tp.file.rename(slug)
-%>
---
category: <% slug %>
title: <% title %>
---
One-liner overview for the category...