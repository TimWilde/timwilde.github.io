<%*
const date = await tp.system.prompt("Post Date", tp.date.now("YYYY-MM-DD"))
const title = await tp.system.prompt("Post Title")
const slug = title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")
const filename = `${date}-${slug}`
await tp.file.rename(filename)
-%>
---
layout: post
title: "<% title %>"
date: <% date %>
categories: []
tags: []
disable-comments: true
---
Introduction paragraph

<!--more-->

Content
