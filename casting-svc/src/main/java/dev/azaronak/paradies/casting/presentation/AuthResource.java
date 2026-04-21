package dev.azaronak.paradies.casting.presentation;

import dev.azaronak.paradies.casting.auth.AuthFilter;
import dev.azaronak.paradies.casting.auth.AuthenticatedUser;
import dev.azaronak.paradies.casting.entities.Resident;
import dev.azaronak.paradies.casting.entities.Session;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import io.smallrye.common.annotation.Blocking;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.mindrot.jbcrypt.BCrypt;

import java.util.UUID;

@Path("/auth")
public class AuthResource {

    @Inject
    AuthenticatedUser authenticatedUser;

    @Inject
    Mailer mailer;

    @ConfigProperty(name = "app.base-url")
    String baseUrl;

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public record LoginRequest(String email, String password) {}
    public record SetupRequest(String inviteToken, String password, String profilePicture, String profilePictureMimeType) {}
    public record MeResponse(UUID id, String name, String email, String roomNumber, String phone, String profilePicture, String profilePictureMimeType, boolean subletting) {}

    // ── Login ─────────────────────────────────────────────────────────────────

    @POST
    @Path("/login")
    @Transactional
    public Response login(LoginRequest req) {
        Resident resident = Resident.find("email", req.email()).firstResult();
        if (resident == null || resident.getPasswordHash() == null) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("Invalid credentials").build();
        }
        if (!BCrypt.checkpw(req.password(), resident.getPasswordHash())) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("Invalid credentials").build();
        }

        Session session = Session.create(resident);
        session.persist();

        NewCookie cookie = new NewCookie.Builder(AuthFilter.COOKIE_NAME)
                .value(session.getToken())
                .path("/")
                .maxAge(30 * 24 * 60 * 60) // 30 days
                .httpOnly(true)
                .sameSite(NewCookie.SameSite.LAX)
                .build();

        return Response.ok(toMe(resident)).cookie(cookie).build();
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    @POST
    @Path("/logout")
    @Transactional
    public Response logout(@CookieParam(AuthFilter.COOKIE_NAME) String token) {
        if (token != null) {
            Session session = Session.findById(token);
            if (session != null) session.delete();
        }

        NewCookie clear = new NewCookie.Builder(AuthFilter.COOKIE_NAME)
                .value("")
                .path("/")
                .maxAge(0)
                .httpOnly(true)
                .build();

        return Response.noContent().cookie(clear).build();
    }

    // ── Me (who am I?) ────────────────────────────────────────────────────────

    @GET
    @Path("/me")
    @Blocking
    public Response me(@CookieParam(AuthFilter.COOKIE_NAME) String token) {
        if (token == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Session session = Session.findById(token);
        if (session == null || session.isExpired()) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        return Response.ok(toMe(session.getResident())).build();
    }

    // ── Account Setup (invite token → set password) ───────────────────────────

    @POST
    @Path("/setup")
    @Transactional
    public Response setup(SetupRequest req) {
        if (req.inviteToken() == null || req.password() == null || req.password().length() < 6) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Password must be at least 6 characters").build();
        }

        Resident resident = Resident.find("inviteToken", req.inviteToken()).firstResult();
        if (resident == null) {
            return Response.status(Response.Status.NOT_FOUND).entity("Invalid invite token").build();
        }

        resident.setPasswordHash(BCrypt.hashpw(req.password(), BCrypt.gensalt()));
        resident.clearInviteToken();
        if (req.profilePicture() != null) {
            resident.setProfilePicture(req.profilePicture(), req.profilePictureMimeType());
        }

        // Auto-login after setup
        Session session = Session.create(resident);
        session.persist();

        NewCookie cookie = new NewCookie.Builder(AuthFilter.COOKIE_NAME)
                .value(session.getToken())
                .path("/")
                .maxAge(30 * 24 * 60 * 60)
                .httpOnly(true)
                .sameSite(NewCookie.SameSite.LAX)
                .build();

        return Response.ok(toMe(resident)).cookie(cookie).build();
    }

    // ── Forgot password ───────────────────────────────────────────────────────

    public record ForgotPasswordRequest(String email) {}

    @POST
    @Path("/forgot-password")
    @Transactional
    @Blocking
    public Response forgotPassword(ForgotPasswordRequest req) {
        Resident resident = Resident.find("email", req.email()).firstResult();
        if (resident != null) {
            String token = resident.generateResetToken();
            String resetUrl = baseUrl + "/setup/" + token;
            mailer.send(Mail.withText(
                resident.getEmail(),
                "Paradies — reset your password",
                "Hi " + resident.getName() + ",\n\n" +
                "Someone requested a password reset for your Paradies account.\n\n" +
                "Click the link below to set a new password:\n" +
                resetUrl + "\n\n" +
                "If you didn't request this, you can ignore this email.\n\n" +
                "— Paradies ✦"
            ));
        }
        // Always return 200 — never reveal whether the email is registered
        return Response.ok().build();
    }

    // ── Check invite / reset token validity ──────────────────────────────────

    @GET
    @Path("/invite/{token}")
    @Blocking
    public Response checkInvite(@PathParam("token") String token) {
        Resident resident = Resident.find("inviteToken", token).firstResult();
        if (resident == null) {
            return Response.status(Response.Status.NOT_FOUND).entity("Invalid invite").build();
        }
        return Response.ok(new InviteInfo(resident.getName(), resident.getEmail(), resident.isAccountSetUp())).build();
    }

    public record InviteInfo(String name, String email, boolean isReset) {}

    // ── Update own profile ────────────────────────────────────────────────────

    public record UpdateMeRequest(String phone, String profilePicture, String profilePictureMimeType) {}

    @PUT
    @Path("/me")
    @Transactional
    @Blocking
    public Response updateMe(@CookieParam(AuthFilter.COOKIE_NAME) String token, UpdateMeRequest req) {
        if (token == null) return Response.status(Response.Status.UNAUTHORIZED).build();
        Session session = Session.findById(token);
        if (session == null || session.isExpired()) return Response.status(Response.Status.UNAUTHORIZED).build();

        Resident resident = session.getResident();
        resident.setPhone(req.phone());
        if (req.profilePicture() != null) {
            resident.setProfilePicture(req.profilePicture(), req.profilePictureMimeType());
        }
        return Response.ok(toMe(resident)).build();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static MeResponse toMe(Resident r) {
        return new MeResponse(r.getId(), r.getName(), r.getEmail(), r.getRoomNumber(), r.getPhone(), r.getProfilePicture(), r.getProfilePictureMimeType(), r.isSubletting());
    }
}
