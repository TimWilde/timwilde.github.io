---
layout: page
title: Tags
---
{% assign allTags = '' %}

{% for page in site.posts %}
   {% if page.tags.size > 0 %}
      {% assign dedupedTags = allTags %}

      {% for tag in page.tags %}
         {% if tag != '' %}
            {% if dedupedTags == '' %}
               {% assign dedupedTags = tag %}
            {% endif %}

            {% unless dedupedTags contains tag %}
               {% assign dedupedTags = dedupedTags | join:'|' | append:'|' | append:tag | split:'|' %}
            {% endunless %}
         {% endif %}
      {% endfor %}
   {% endif %}

   {% assign allTags = dedupedTags | sort %}
{% endfor %}

{%- if allTags.size > 0 %}

<div class="tags">
   {% for tag in allTags %}
   <a class="tag" href="#{{ tag | slugify }}">{{tag}}</a>
   {% endfor %}
</div>

   {%- for tag in allTags %}
<h3 id="{{tag | slugify}}">{{ tag | capitalize }}</h3>
<ul>
      {%- for page in site.posts %}
         {%- if page.tags contains tag %}
   <li><a href="{{site.baseurl}}{{page.url}}">{{page.title}}</a></li>
         {%- endif %}
      {%- endfor %}
</ul>
   {%- endfor %}
{%- endif %}