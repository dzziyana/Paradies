package dev.azaronak.paradies.casting.presentation;

import dev.azaronak.paradies.casting.entities.Application;
import dev.azaronak.paradies.casting.entities.AppStatus;
import dev.azaronak.paradies.casting.entities.MagicLink;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;

import java.util.UUID;

@Path("/magic-link")
public class MagicLinkResource {

    public record MagicLinkView(
            String applicationName,
            String castingMoveInDate,
            String status,
            UUID applicationId,
            UUID castingId
    ) {}

    /** Validate a magic link token and return the applicant's status. */
    @GET
    @Path("/{token}")
    public MagicLinkView validate(@PathParam("token") String token) {
        MagicLink ml = MagicLink.findById(token);
        if (ml == null || ml.isExpired()) {
            throw new NotFoundException("Invalid or expired link");
        }
        Application app = ml.getApplication();
        return new MagicLinkView(
                app.getName(),
                ml.getCasting().getMoveInDate().toString(),
                app.getStatus() != null ? app.getStatus().name() : "SUBMITTED",
                app.getId(),
                ml.getCasting().getId()
        );
    }

    /** Withdraw an application via magic link. */
    @PUT
    @Path("/{token}/withdraw")
    @Transactional
    public void withdraw(@PathParam("token") String token) {
        MagicLink ml = MagicLink.findById(token);
        if (ml == null || ml.isExpired()) {
            throw new NotFoundException("Invalid or expired link");
        }
        Application app = ml.getApplication();
        app.setStatus(AppStatus.WITHDRAWN);
    }
}
