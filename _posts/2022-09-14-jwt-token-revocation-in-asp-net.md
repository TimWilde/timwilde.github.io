---
layout: post
title: JWT Token Revocation in ASP.NET
tags:
  - ASP.NET
  - Web
  - API
  - JWT
  - Tokens
  - Authentication
  - Server-Side
date: 2022-09-14
toc: true
---
JWT tokens are a popular way to implement authentication and authorization. The _problem_ with JWT tokens is that they don't intrinsically provide a revocation mechanism: tokens are valid until they expire.

Let's take a look at one way to add that feature to ASP.NET projects.

<!--more-->

## Preamble

I'm going to assume that you have authentication and authorization working with JWT tokens in your ASP.NET Web API already: users of your app can sign _in_ &mdash; signing out is the problem.

Perhaps your project has a mobile or single page application front-end that sends user credentials to a RESTful-ish[^1] API that responds with a JWT token if they are valid. The presence of the token indicates authentication (the user has proven their identity) and the claims in the token, if any, define the roles the user is authorized to perform.

[^1]: Everyone _starts_ with a RESTful API...

The front-end will include the encoded JWT token with each request as a `Bearer` token in the `Authorization` header that the server will extract, decode, and validate before processing each request. If anything about the token doesn't pass muster the server immediately rejects the request.

## The Problem

> As the token is stored on the client &mdash; precisely how is out of scope for this post &mdash; without any mechanism for the server-side code to control its lifetime; how can the server decide when to deny a token even when it hasn't expired?

There is a solution to this in the [OWASP Cheat Sheet Series](https://github.com/OWASP/CheatSheetSeries){:target="_blank"} and that is to implement a sort of [_reverse_ session key management system](https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.md#no-built-in-token-revocation-by-the-user){:target="_blank"}: a block list that records which tokens that haven't yet expired should, nevertheless, be rejected. This is subtly different to normal session key stores. Those record every active session key and the server pays for that with increased memory usage: thousands of users means thousands of session keys in memory.

The OWASP solution is rather elegant in that only those tokens that are currently active but should be disavowed need to be recorded and, as JWT tokens expire by design, that record only needs to be maintained until the token has lapsed. Rather than recording thousands of tokens for thousands of users, indefinitely, the server now only needs to record the subset of tokens where those tokens have been revoked (perhaps a low percentage of the total) and only for the remaining time while the token would otherwise be valid[^2].

[^2]: A problem almost perfectly specced for [Redis EXPIRE](https://redis.io/commands/expire/){:target="_blank"}.

## The Solution

For all the wordage so far, the solution is pleasantly simple: a custom token lifetime validator.

### The code

When configuring the ASP.NET dependency injection container, the following code is used to add JWT Bearer Token support:

{% gist 06e04730d26a0c24c369ea69a79f9c75 add-jwt-bearer.cs %}

And the members of `TokenValidationParameters` is where we will find what we are looking for: the `LifetimeValidator` property.

When a [lifetime validator delegate](https://docs.microsoft.com/en-us/dotnet/api/Microsoft.IdentityModel.Tokens.LifetimeValidator?view=azure-dotnet&viewFallbackFrom=netstandard-2.0){:target="_blank"} is provided it will be called[^3] for every token that the API receives and has the opportunity to decide whether the token is still considered valid. A default implementation might just check the `ValidFrom` and `ValidTo` properties of a JWT token, but this is an ideal place to add a check against a block list too.

[^3]: Regardless of the value of the `ValidateLifetime` property, it should be noted.

First, lets plug in that custom lifetime validation, then discuss what it does:

{% gist 06e04730d26a0c24c369ea69a79f9c75 configure-token-options.cs %}

This code runs during the container configuration phase. So, frustratingly, the container can't be called upon to provide an instance of `JwtTokenLifetimeManager`, a custom class that contains the token-management logic. Instead, an instance is created manually and then added to the container as a singleton as it will be required in a controller where the sign out functionality is implemented. It looks like this:

{% gist 06e04730d26a0c24c369ea69a79f9c75 JwtTokenLifetimeManager.cs %}

For this example, it maintains an internal `ConcurrentDictionary<string, DateTime>` that records token signatures and expiry timestamps. The `ValidateTokenLifetime` logic then does the usual time-based checks and, if the token is currently valid, then checks to see if it is in the list of disavowed tokens.

In a more production-ready version of this code I would recommend making the `DisavowedSignatures` storage pluggable, perhaps backed by something like Redis, which would help this scale more easily.

The second method that the `JwtTokenLifetimeManager` provides is `SignOut`. This simply records the token's signature and expiry timestamp then trims any that are in that list but have lapsed: a bit of housekeeping to keep the list lean.

Then, finally, the sign out controller action just retrieves the `Authorization` header, trims the `Bearer ` prefix and passes the decoded JWT token to the `TokenLifetimeManager`.

{% gist 06e04730d26a0c24c369ea69a79f9c75 sign-out-action.cs %}

## Conclusion

I think this approach, suggested in the OWASP Cheat Sheets, is rather elegant and, as it turns out, pretty straight-forward to implement in ASP.NET.

This post shows a much-simplified example of how it could be implemented; if you do follow these ideas do make sure to implement some error handling and consider making the disavowed token storage a separate, injectable type that stores its data in an out-of-proc store otherwise there will be all sorts of odd _signed-in then not signed-in_ problems when scaling beyond a single host.

Which leads me to a closing question: is there a more elegant way to handle dependencies that need to exist before the `builder.build()` call, like the `JwtTokenLifetimeManager` in this example?