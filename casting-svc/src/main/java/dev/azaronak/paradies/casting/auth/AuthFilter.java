package dev.azaronak.paradies.casting.auth;

import dev.azaronak.paradies.casting.entities.Session;
import io.smallrye.common.annotation.Blocking;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Cookie;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

/**
 * JAX-RS filter that enforces session authentication on protected paths.
 * <p>
 * Public paths (application submission, auth endpoints, magic links) are excluded.
 * Everything under /castings/*, /residents/*, /cleaning-duties/*, /rooms/* requires
 * a valid PARADIES_SESSION cookie.
 */
@Provider
@Blocking
public class AuthFilter implements ContainerRequestFilter {

    public static final String COOKIE_NAME = "PARADIES_SESSION";

    @Inject
    AuthenticatedUser authenticatedUser;

    @Override
    public void filter(ContainerRequestContext ctx) {
        String path = ctx.getUriInfo().getPath();
        String method = ctx.getMethod();

        // --- public paths: no auth needed ---
        if (path.startsWith("/auth")) return;
        if (path.startsWith("/q/")) return;  // Quarkus dev UI

        // Application submission is public (POST to /castings/{id}/application, not /applications)
        if (method.equals("POST") && path.matches("/castings/[^/]+/application/?$")) return;

        // Magic link validation is public
        if (path.startsWith("/magic-link")) return;

        // All other paths under protected prefixes require a session
        boolean isProtected = path.startsWith("/castings")
                || path.startsWith("/residents")
                || path.startsWith("/cleaning-duties")
                || path.startsWith("/rooms");

        if (!isProtected) return;

        Cookie cookie = ctx.getCookies().get(COOKIE_NAME);
        if (cookie == null) {
            ctx.abortWith(Response.status(Response.Status.UNAUTHORIZED).entity("Not authenticated").build());
            return;
        }

        Session session = Session.findById(cookie.getValue());
        if (session == null || session.isExpired()) {
            ctx.abortWith(Response.status(Response.Status.UNAUTHORIZED).entity("Session expired").build());
            return;
        }

        authenticatedUser.set(session.getResident());
    }
}
