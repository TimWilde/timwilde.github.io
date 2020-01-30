---
layout: page
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


<h2>Tags</h2>
{%- if allTags.size > 0 %}
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