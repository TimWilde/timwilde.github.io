---
layout: page
title: Categories
hide_title: true
---
{%- assign allCategories = site.posts | map:"categories" | uniq | compact | sort_natural %}

{%- if allCategories.size > 0 %}

   {%- for category in allCategories %}

      {%- assign categoryData = site.series | where: "category", category | first %}
      {%- if categoryData == null %}
<strong class="alert">Category '{{category}}' is not configured!</strong>
      {%- endif %}

<section data-category="{{ category | slugify }}">
<h2 class="category" id="{{ category | slugify }}" data-category="{{category | slugify}}">{{ categoryData.title }}</h2>
{{categoryData.output}}
<ul>
      {%- for page in site.posts %}
         {%- if page.categories contains category %}
            {%- assign categories = "" | split: "," %}
            {%- for pagecategory in page.categories %}
               {%- assign categorySlug = pagecategory | slugify %}
               {%- assign categories = categories | push: categorySlug %}
            {%- endfor %}
   <li><a href="{{site.baseurl}}{{page.url}}" data-categorys="{{ categories | join: "," }}">{{page.title}}</a></li>
         {%- endif %}
      {%- endfor %}
</ul>
</section>
   {%- endfor %}
{%- endif %}
