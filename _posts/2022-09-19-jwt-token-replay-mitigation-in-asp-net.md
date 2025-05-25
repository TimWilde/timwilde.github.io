---
layout: post
title: JWT Token Replay Mitigation in ASP.NET
tags:
  - ASP.NET
  - Web
  - API
  - JWT
  - Tokens
  - Authentication
  - Server-Side
links:
  owasp-jwt-side-jacking: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html#token-sidejacking
  mdn-cookies: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies
  cookie-prefixes: https://datatracker.ietf.org/doc/html/draft-west-cookie-prefixes
  token-replay-delegate: https://learn.microsoft.com/en-us/dotnet/api/microsoft.identitymodel.tokens.tokenreplayvalidator?view=azure-dotnet
  rfc-jti-claim: https://www.rfc-editor.org/rfc/rfc7519.html#section-4.1.7
  spa-jwt-demo: https://github.com/TimWilde/spa-jwt-demo
  demo-program: https://github.com/TimWilde/spa-jwt-demo/blob/main/FrontEnd.SPA/Program.cs
  demo-jwt-bearer-config: https://github.com/TimWilde/spa-jwt-demo/blob/main/FrontEnd.SPA/Configurations/JwtBearerConfiguration.cs
  demo-infrastructure: https://github.com/TimWilde/spa-jwt-demo/tree/main/FrontEnd.SPA/Infrastructure
  demo-auth-controller: https://github.com/TimWilde/spa-jwt-demo/blob/main/FrontEnd.SPA/Controllers/AuthenticationController.cs
  demo-client-app: https://github.com/TimWilde/spa-jwt-demo/tree/main/FrontEnd.SPA/ClientApp
  github-wouter: https://github.com/molefrog/wouter
  recoiljs: https://recoiljs.org/
date: 2022-09-19
---
In a previous post, we had a look at [how JWT tokens can be revoked]({%- link _posts/2022-09-14-jwt-token-revocation-in-asp-net.md %}) before they expire in order to build a sign out feature. The next problem is that tokens can be captured and used in nefarious requests: token replay attacks.

Let's look at a method for reducing the viability of these attacks in ASP.NET projects.

<!--more-->

## Token Sidejacking

Once again, the OWASP Cheat Sheets suggest a mechanism that we can implement to make token replay attacks &mdash; also known as [token sidejacking]({{page.links.owasp-jwt-side-jacking}}){:target="_blank"} &mdash; less viable. I'm hesitant to say "this will block the attacks," as I'm not convinced the approach is completely infallible, but it should at least make it more difficult than a simple copy and paste operation.

This works by adding an extra claim to the token &mdash; described as "user context": a randomly generated string unique to the user session, for example &mdash; and to also add it to a [hardened cookie]({{page.links.mdn-cookies}}){:target="_blank"}. This user context is stored hashed in the JWT token and as plain text in the cookie.

The browser will automatically include the cookie with each request so the server can then hash the contents using the same mechanism as used to create the JWT token representation, and compare it to the hashed value in the token claim. If they match then this request came from the same end-user that signed in and received the JWT token in the first place.

### Hardened Cookies

There are several promises that are upheld for a hardened cookie. First, it will not be transmitted via an unencrypted link. That is, if the request is not made via HTTPS then the cookie is not included, so interception should be difficult. Next, the HTTP Only flag means that it is not accessible to code when at rest in the browser, making it difficult to access programmatically. The Same Site flag means that it will only be included in requests made to the site from which it was issued and [name prefixes]({{page.links.cookie-prefixes}}){:target="_blank"} bake-in some of these flags.

What this should mean is that, when the cookie arrives back at the server, it is reasonable to assume that it hasn't been tampered with, and originated from the client to which it was originally assigned.

OK; that's the theory. Let's look at how this can be implemented in ASP.NET.

## Implementing Replay Mitigation

Like before, this is configured in the `builder.Services.AddJwtBearer` configuration step and is, again, one of the properties of `options.TokenValidationParameters`: `TokenReplayValidator`.

``` csharp
builder.Services.AddJwtBearer( options =>
{
   options.TokenValidationParameters = new TokenValidationParameters
   {
      ValidIssuer = builder.Configuration[ "Jwt:Issuer" ],
      ValidAudience = builder.Configuration[ "Jwt:Audience" ],
      IssuerSigningKey = new SymmetricSecurityKey( Encoding.UTF8.GetBytes( builder.Configuration[ "Jwt:Key" ] ) ),
      ValidateIssuer = true,
      ValidateAudience = true,
      ValidateIssuerSigningKey = true,
      ValidateLifetime = true,
      LifetimeValidator = LifetimeValidator,
      TokenReplayValidator = TokenReplayValidator // <- new addition
   };
});
```

`TokenReplayValidator` is another [delegate that receives three arguments]({{page.links.token-replay-delegate}}){:target="_blank"}: the expiration time of the token; the raw, encoded representation of the token; and the validation parameters. We don't need to worry about the expiration time property as that is taken care of by our lifetime validator from the previous post, so we can concentrate on the raw encoded token.

But, first...

### Accessing the Cookie

Reading the cookie, it turns out, is a little bit complicated. To do so, a reference to the current request is required. To get access to that we need the current `HttpContext` and that is made available through the `IHttpContextAccessor` interface made available via dependency injection.

As discovered in the previous post, this code is configured before the dependency injection container is available so we need to rethink how we can achieve this. For the lifetime validator &mdash; that doesn't have any extra dependencies &mdash; it was possible to simply create a new instance and push that into the container. In this case, we will need to rely on the container to provide the `IHttpContextAccessor`. This brings us to the ASP.NET "Add then Use" pattern for configuration.

The first step is to create an interface and class to contain the token replay code.

``` csharp
public interface ITokenReplayManager
{
   bool ValidateToken( DateTime? expirationTime,
                       string securityToken,
                       TokenValidationParameters validationParameters );
}

public class JwtTokenReplayManager : ITokenReplayManager
{
   private readonly IHttpContextAccessor contextAccessor;

   public JwtTokenReplayManager( IHttpContextAccessor contextAccessor )
   {
      this.contextAccessor = contextAccessor;
   }

   public bool ValidateToken( DateTime? expirationTime,
                              string securityToken,
                              TokenValidationParameters validationParameters )
   {
      // ...
   }
}
```

And those are registered as services along with the `IHttpContextAccessor`.

``` csharp
builder.Services
       .AddHttpContextAccessor()
       .AddSingleton<ITokenReplayManager, JwtTokenReplayManager>();
```

Next; the `AddJwtBearer` configuration is moved into a static class that will capture the various auxiliaries.

``` csharp
builder.Services
       .AddJwtBearer( JwtBearerConfiguration.SetUp( builder ) );
```
``` csharp
public static class JwtBearerConfiguration
{
   private static IServiceProvider? services;

   private static ITokenReplayManager? ReplayManager => services!.GetService<ITokenReplayManager>();

   public static IApplicationBuilder UseJwtTokenManagement( this IApplicationBuilder builder )
   {
      services = builder.ApplicationServices;

      return builder;
   }

   public static Action<JwtBearerOptions> SetUp( WebApplicationBuilder builder ) =>
      options =>
      {
         options.TokenValidationParameters = new TokenValidationParameters
         {
            // ...
            TokenReplayValidator = TokenReplayValidator
         };
      };

   private static bool TokenReplayValidator( DateTime? expirationTime,
                                             string securityToken,
                                             TokenValidationParameters validationParameters ) =>
      ReplayManager?.ValidateToken( expirationTime, securityToken, validationParameters ) ?? false;
}
```

This does three things:

1. Encapsulates the `JwtBearerOptions` creation (the `SetUp` property);
1. Defines the `TokenReplayValidator` delegate; and
1. Provides a mechanism to postpone access to the container

This last step defines the `UseJwtTokenManagement` extension method that is called after `builder.Build()` in the application configuration. The method just records a reference to the newly-created `IServiceProvider` that will allow the code to resolve services at runtime. This is then used by the private `ReplayManager` property to get the service on demand &mdash; leaving the resolution of the service until the latest possible moment.

It's not ideal: it's effectively the service locator pattern, which means the code "knows" too much about how to configure itself, but it seems to be the least bad solution, given how the ASP.NET container is configured.

Now the delegate is defined and has access to the `IHttpContextAccessor` to (ultimately) access the cookie in the request. Let's look at that implementation.

``` csharp
public class JwtTokenReplayManager : ITokenReplayManager
{
   private readonly IHttpContextAccessor contextAccessor;

   public JwtTokenReplayManager( IHttpContextAccessor contextAccessor )
   {
      this.contextAccessor = contextAccessor;
   }

   public bool ValidateToken( DateTime? expirationTime,
                              string securityToken,
                              TokenValidationParameters validationParameters )
   {
      if ( contextAccessor.HttpContext!.Request.Cookies.TryGetValue( "__Host-vftn", out string? fingerprint ) is false ||
           string.IsNullOrWhiteSpace( fingerprint ) )
         return false;

      string encodedFingerprint = Encode( fingerprint );

      var jwtToken = new JwtSecurityToken( securityToken );

      Claim? jtiClaim = jwtToken.Payload.Claims.FirstOrDefault( x => x.Type == JwtRegisteredClaimNames.Jti );

      return string.IsNullOrWhiteSpace( encodedFingerprint ) is false &&
             string.IsNullOrWhiteSpace( jtiClaim?.Value ) is false &&
             string.Equals( jtiClaim.Value, encodedFingerprint, StringComparison.Ordinal );
   }

   public static string Encode( string input ) =>
      Convert.ToBase64String( SHA256.HashData( Encoding.UTF8.GetBytes( input ) ) );
}
```

In the `ValidateToken` method, the first step is an attempt to retrieve the contents of the hardened cookie. If this fails the code exits early; rejecting the token.

With access to the cookie content it is first encoded using the same method that was used to encode the data added to the token: both use the `JwtTokenReplayManager.Encode` method. Next; the string representation of the JWT token is decoded and [the `Jti` claim]({{page.links.rfc-jti-claim}}){:target="_blank"} is retrieved from its `Payload`.

> The "jti" claim can be used to prevent the JWT from being replayed.

With both the previously-encoded Jti claim and newly encoded cookie content to hand (and both checked to be non-null) they are compared. If they match, the token is accepted.

## In Summary

That looks and sounds quite complicated, but is reasonably straight forward once all the ASP.NET-specifics are ignored. The process is:

- Generate a unique code when the user successfully authenticates
- Hash the unique code and add it to the JWT token as a "JTI" claim that is designed for this purpose
- Also add the plain-text version of the code to a hardened cookie and send both to the client
- When a request is received, get the contents of the cookie and the "JTI" claim
- Hash the cookie contents and compare the two
- If they match, the request is, more-than-likely, not fraudulent

Fragments of code in a blog post aren't the easiest to follow without the wider context, so I have made a small sample ASP.NET app with a React front-end to demo this and the lifetime validation. [That repository is available at GitHub]({{page.links.spa-jwt-demo}}){:target="_blank"}.

Files of interest in the demo codebase are:

- [Program.cs]({{page.links.demo-program}}){:target="_blank"} shows all of the configuration discussed
- [Configurations\JwtBearerConfiguration.cs]({{page.links.demo-jwt-bearer-config}}){:target="_blank"} contains the JWT configuration discussed
- [Infrastructure]({{page.links.demo-infrastructure}}){:target="_blank"} contains the lifetime and replay implementations
- [Controllers\AuthenticationController.cs]({{page.links.demo-auth-controller}}){:target="_blank"} contains the code that creates the JWT and the cookie
- [ClientApp]({{page.links.demo-client-app}}){:target="_blank"} a React front-end with most of the defaults removed and reconfigured with [Wouter]({{page.links.github-wouter}}){:target="_blank"} and [Recoil]({{page.links.recoiljs}}){:target="_blank"}