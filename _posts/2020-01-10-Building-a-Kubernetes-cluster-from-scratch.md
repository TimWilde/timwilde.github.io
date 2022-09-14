---
layout: post
title: Building a Kubernetes Cluster from Scratch
tags: [Kubernetes, Docker, Hardware, DevOps, Multi-Part]
---
I've been using Docker and Docker Swarm for several years but have always been under the impression that Kubernetes wasn't necessary unless you were managing hosting at Google scale - hundreds or thousands of servers, and astronomical numbers of services. I'd had a look at Kubernetes a few times but, compared to the Docker Compose files I was used to, it just seemed so... complicated.

<!--more-->

Then, in November 2019, [Mirantis acquired the Docker Enterprise arm from Docker Inc.](https://www.mirantis.com/blog/mirantis-acquires-docker-enterprise-platform-business/) and they specifically state that they expect Docker Swarm users to transition to Kubernetes.

> The primary orchestrator going forward is Kubernetes. Mirantis is committed to providing an excellent experience to all Docker Enterprise platform customers and currently expects to support Swarm for at least two years, depending on customer input into the roadmap.

So it's time to learn Kubernetes!

## Let's Make this Fun

There are a few ways to spin up a Kubernetes cluster such as [Play with Kubernetes](https://labs.play-with-k8s.com/), or by provisioning a set of workers on [DigitalOcean](https://www.digitalocean.com/products/kubernetes/) or [Azure](https://azure.microsoft.com/en-gb/services/kubernetes-service/). All of these will take care of cluster management allowing you to concentrate on running your services. These probably reflect how most people will use Kubernetes in Production so they are perfect for setting up a lab environment to learn.

The downside to this is that a whole piece of the Kubernetes management story is overlooked; namely setting up the host environment. This could be done by creating a set of virtual machines in an Infrastructure-as-a-Service environment but I started my career in IT, _in IT_, and I find any excuse to dabble with real servers and networking is hard to resist.

Physical servers it is then!

I also decided that I wanted this to be a pretty good representation of a production system so I added a few extra requirements:

- I want several physical servers so that I can experiment with adding hosts to- and removing (or failing) hosts from the cluster
- There will be an external, physical load balancer in front of the cluster
- I want to set up _proper_ monitoring at all levels
- Configuring each server individually sounds boring and inefficient, so let's not do that
- Oh, it has to be resilient to power outages, too
- This will live on my home network as a first-class citizen, not in a lab environment, because...
- I plan to use this to host a few services for some IoT projects I've been meaning to get around to

There are a few constraints too:

- This will live in a home environment, not a server room, so it has to be reasonably quiet
- I really don't want to take a massive hit for power with this but it still has to run 24/7
- As much as I'd love a 42U rack in the garage, I realistically just don't have the space for that

I did some [day-dreaming](https://www.reddit.com/r/ServerPorn/) about an 18U rack with a set of Dell 600-series servers; or even a Dell PowerEdge M series blade chassis but even when shopping for quality second-hand hardware at places like [Bargain Hardware](https://www.bargainhardware.co.uk/) the prices were still prohibitive and the space and power requirements, let alone noise levels, would make this a non-starter.

## Go Small or Go Home

I eventually found what I think is the perfect solution: Dell's OptiPlex Micro range of desktop PCs. With a footprint smaller than many IT books, they run silent and use as little as [10 watts when idle](http://www.tpcdb.com/product.php?id=2171).

With a bit of research I decided that the OptiPlex 9020 Micro with a 4th generation Intel i5 processor was a good fit: it's a 4 core, 4 thread CPU which supports all the useful CPU extensions I may need (particularly virtualization and AES-NI instructions). It supports up to 16GB of Ram and can be configured with two hard drives: an M.2 form factor drive and a 2.5" 'laptop' drive.

Thanks to companies having IT hardware refresh cycles, I managed to find some on eBay at reasonable prices, so I grabbed a few. When they arrived it occurred to me that these would fit perfectly into a comms cabinet with a rack-mount switch to create a DIY blade server setup, of sorts. Measuring the space in a 6U comms rack that I ordered for the project I realised that the width is perfectly divisible by eight. A fun little number for IT projects, and the inspiration for the name for this project.

## The 8-bit Micro Cluster

Now more of a tiny datacentre, this setup will be comprised of eight lilliputian PCs: six Dell OptiPlex 9020 Micro PCs which will host the Kubernetes cluster and two Lenovo M93 Micro PCs which will be used as a load balancer and a dedicated monitoring server. The OptiPlexes will all be configured identically, and the two M93s will also have the same configuration as each other.

## Things to Come

Now that we have some requirements and an idea of how to make this all a bit more fun I will be writing a series of posts documenting the process of putting it all together.

<dl>
    <dt>The Hardware</dt>
    <dd>Testing the PCs, Configuring the Network, Power Requirements</dd>
    <dt>Managing the Hosts with Ansible</dt>
    <dd>Configuring servers one-by-one is tedious an error-prone, so we use Ansible to automate operations across all of them at once</dd>
    <dt>Setting Up a Kubernetes Cluster</dt>
    <dd>The first attempt at creating a basic Kubernetes cluster</dd>
    <dt>Monitoring with Prometheus and Grafana</dt>
    <dd>Everyone loves a good DevOps dashboard!</dd>
    <dt>A Custom Power Usage Prometheus Exporter</dt>
    <dd>Reading metrics from smart power sockets with power consumption data and an API</dd>
    <dt>Designing the Rack Mounting Equipment</dt>
    <dd>We design and 3D print some caddies to mount the eight servers into the comms cabinet</dd>
    <dt>Project Review</dt>
    <dd>How did it turn out? What lessons were learned?</dd>
</dl>
