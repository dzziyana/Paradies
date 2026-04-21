package dev.azaronak.paradies.casting.presentation;

import dev.azaronak.paradies.casting.entities.*;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Path("/castings")
public class CastingResource {

    @Inject
    Mailer mailer;

    /** Lightweight DTO for casting listings — counts only, no application data. */
    public record CastingListItem(
            UUID id, LocalDate moveInDate, LocalDate moveOutDate, LocalDateTime time,
            String replacedPersonName, LocalDate applicationUntil,
            boolean applicationOpen, boolean applicationPeriodActive,
            boolean sublet, int applicationCount, long unevaluatedCount, Room room
    ) {}

    /** DTO for active castings with inline application overviews (no profile picture blobs). */
    public record ActiveCastingWithApps(
            UUID id, LocalDate moveInDate, LocalDate moveOutDate, LocalDateTime time,
            String replacedPersonName, LocalDate applicationUntil,
            boolean applicationOpen, boolean applicationPeriodActive,
            boolean sublet, int applicationCount, long unevaluatedCount, Room room,
            List<ApplicationResource.ApplicationOverview> applications
    ) {}

    private static CastingListItem toListItem(Casting c) {
        return new CastingListItem(
                c.getId(), c.getMoveInDate(), c.getMoveOutDate(), c.getTime(),
                c.getReplacedPersonName(), c.getApplicationUntil(),
                c.isApplicationOpen(), c.isApplicationPeriodActive(),
                c.isSublet(), c.getApplicationCount(), c.getUnevaluatedCount(), c.getRoom());
    }

    private static ActiveCastingWithApps toActiveWithApps(Casting c) {
        var apps = c.getApplications().stream()
                .map(a -> {
                    var evals = a.getEvaluations();
                    int yes = 0, maybe = 0, no = 0, veto = 0;
                    for (var e : evals) {
                        switch (e.getJudgement()) {
                            case YES, FRIEND -> yes++;
                            case MAYBE -> maybe++;
                            case NO, NOT_WOKO -> no++;
                            case VETO -> veto++;
                        }
                    }
                    return new ApplicationResource.ApplicationOverview(
                            a.getId(), a.getName(), a.getOccupation(), a.getAge(),
                            a.getUniversity(), a.getMajor(), a.getStatus(),
                            a.getProfilePicture() != null, a.getExtractedKeywords(),
                            yes, maybe, no, veto);
                })
                .toList();
        return new ActiveCastingWithApps(
                c.getId(), c.getMoveInDate(), c.getMoveOutDate(), c.getTime(),
                c.getReplacedPersonName(), c.getApplicationUntil(),
                c.isApplicationOpen(), c.isApplicationPeriodActive(),
                c.isSublet(), c.getApplicationCount(), c.getUnevaluatedCount(), c.getRoom(), apps);
    }

    @GET
    public List<CastingListItem> listCastings() {
        return Casting.<Casting>find("SELECT DISTINCT c FROM Casting c LEFT JOIN FETCH c.applications ORDER BY c.moveInDate DESC")
                .list().stream().map(CastingResource::toListItem).toList();
    }

    @GET
    @Path("/active/applications")
    public List<ActiveCastingWithApps> listActiveApplications() {
        return Casting.<Casting>find("SELECT DISTINCT c FROM Casting c LEFT JOIN FETCH c.applications WHERE c.moveInDate >= ?1 ORDER BY c.moveInDate ASC", LocalDate.now())
                .list().stream().map(CastingResource::toActiveWithApps).toList();
    }

    @POST
    @Transactional
    public UUID createCasting(CreateCastingRequest req) {
        Casting casting = Casting.create(req.moveInDate(), req.moveOutDate(), req.replacedPersonName(), req.applicationUntil(), req.sublet());
        if (req.roomId() != null) {
            Room room = Room.findById(req.roomId());
            if (room != null) casting.setRoom(room);
        }
        casting.persist();
        return casting.getId();
    }

    public record CreateCastingRequest(
            LocalDate moveInDate,
            LocalDate moveOutDate,
            String replacedPersonName,
            LocalDate applicationUntil,
            UUID roomId,
            boolean sublet
    ) {}

    /** Public-facing DTO for the applicant portal — no counts, no internal data. */
    public record CastingPublicView(
            UUID id,
            LocalDate moveInDate,
            LocalDate moveOutDate,
            String replacedPersonName,
            LocalDate applicationUntil,
            boolean applicationPeriodActive,
            boolean sublet,
            Room room
    ) {}

    @GET
    @Path("/{castingId}")
    public CastingPublicView getCasting(@PathParam("castingId") UUID castingId) {
        Casting casting = Casting.findById(castingId);
        if (casting == null) throw new NotFoundException("Casting not found");
        return new CastingPublicView(
                casting.getId(),
                casting.getMoveInDate(),
                casting.getMoveOutDate(),
                casting.getReplacedPersonName(),
                casting.getApplicationUntil(),
                casting.isApplicationPeriodActive(),
                casting.isSublet(),
                casting.getRoom()
        );
    }

    @PUT
    @Path("/{castingId}/time")
    @Transactional
    public void updateCastingTime(@PathParam("castingId") UUID castingId, SetCastingTimeRequest req) {
        Casting casting = Casting.findById(castingId);
        if (casting == null) throw new NotFoundException("Casting not found");
        casting.setTime(req.time());
    }

    public record SetCastingTimeRequest(LocalDateTime time) {}

    @PUT
    @Path("/{castingId}/close-applications")
    @Transactional
    public void closeApplications(@PathParam("castingId") UUID castingId) {
        Casting casting = Casting.findById(castingId);
        if (casting == null) throw new NotFoundException("Casting not found");
        casting.closeApplicationPeriod();
    }

    @PUT
    @Path("/{castingId}/application-until")
    @Transactional
    public void setApplicationUntil(@PathParam("castingId") UUID castingId, SetApplicationUntilRequest req) {
        Casting casting = Casting.findById(castingId);
        if (casting == null) throw new NotFoundException("Casting not found");
        casting.setApplicationUntil(req.applicationUntil());
    }

    public record SetApplicationUntilRequest(LocalDate applicationUntil) {}

    @PUT
    @Path("/{castingId}/room")
    @Transactional
    public void setCastingRoom(@PathParam("castingId") UUID castingId, SetCastingRoomRequest req) {
        Casting casting = Casting.findById(castingId);
        if (casting == null) throw new NotFoundException("Casting not found");
        if (req.roomId() == null) {
            casting.setRoom(null);
        } else {
            Room room = Room.findById(req.roomId());
            if (room == null) throw new NotFoundException("Room not found");
            casting.setRoom(room);
        }
    }

    public record SetCastingRoomRequest(UUID roomId) {}

    // ── Dispatch: bulk invite/reject based on evaluations ─────────────────────

    public record DispatchSummary(int invited, int rejected, int skipped) {}

    /**
     * Dispatches all evaluated applications for a casting:
     * - EVALUATED_YES → stays EVALUATED_YES (invited to casting event), sends invitation email
     * - EVALUATED_NO  → REJECTED_AFTER_CASTING, sends rejection email
     * - Other statuses (WITHDRAWN, PENDING, etc.) are skipped
     */
    @POST
    @Path("/{castingId}/dispatch")
    @Transactional
    public DispatchSummary dispatch(@PathParam("castingId") UUID castingId) {
        Casting casting = Casting.findById(castingId);
        if (casting == null) throw new NotFoundException("Casting not found");

        int invited = 0, rejected = 0, skipped = 0;

        for (Application app : casting.getApplications()) {
            AppStatus status = app.getStatus();
            if (status == AppStatus.EVALUATED_YES) {
                // Invite — keep status as EVALUATED_YES (they'll attend the casting)
                invited++;
                sendInvitationEmail(app, casting);
            } else if (status == AppStatus.EVALUATED_NO) {
                app.setStatus(AppStatus.REJECTED_AFTER_CASTING);
                rejected++;
                sendRejectionEmail(app, casting);
            } else {
                skipped++;
            }
        }

        // Close applications if still open
        if (casting.isApplicationOpen()) {
            casting.closeApplicationPeriod();
        }

        return new DispatchSummary(invited, rejected, skipped);
    }

    private void sendInvitationEmail(Application app, Casting casting) {
        String timeInfo = casting.getTime() != null
                ? "\n\nThe casting is scheduled for " + casting.getTime().toLocalDate() + " at " + casting.getTime().toLocalTime() + "."
                : "";
        mailer.send(Mail.withText(
                app.getEmail(),
                "Paradies — You're invited to the casting!",
                "Hi " + app.getName() + ",\n\n"
                + "Great news! We'd love to invite you to our WG casting for the room at Kirchgasse 36."
                + timeInfo + "\n\n"
                + "We'll be in touch with more details soon.\n\n"
                + "Best,\nKleines Paradies WG"
        ));
    }

    private void sendRejectionEmail(Application app, Casting casting) {
        mailer.send(Mail.withText(
                app.getEmail(),
                "Paradies — Update on your application",
                "Hi " + app.getName() + ",\n\n"
                + "Thank you for your interest in our WG at Kirchgasse 36. "
                + "Unfortunately, we won't be able to invite you to the casting this time.\n\n"
                + "We wish you all the best in your search!\n\n"
                + "Best,\nKleines Paradies WG"
        ));
    }

    // ── Finalize: pick the new roommate after the casting event ───────────────

    /**
     * Marks one application as MOVED_IN and all other EVALUATED_YES apps as REJECTED_AFTER_CASTING.
     * Sends a welcome email to the chosen applicant and rejection emails to the rest.
     */
    @PUT
    @Path("/{castingId}/finalize")
    @Transactional
    public void finalize(@PathParam("castingId") UUID castingId, @QueryParam("applicationId") UUID applicationId) {
        Casting casting = Casting.findById(castingId);
        if (casting == null) throw new NotFoundException("Casting not found");

        Application chosen = Application.findById(applicationId);
        if (chosen == null) throw new NotFoundException("Application not found");

        chosen.setStatus(AppStatus.MOVED_IN);
        mailer.send(Mail.withText(
                chosen.getEmail(),
                "Paradies — Welcome to the WG!",
                "Hi " + chosen.getName() + ",\n\n"
                + "We're thrilled to have you join Kleines Paradies! "
                + "Welcome to your new home at Kirchgasse 36.\n\n"
                + "We'll be in touch about move-in details.\n\n"
                + "See you soon!\nKleines Paradies WG"
        ));

        // Reject all other invited applicants
        for (Application app : casting.getApplications()) {
            if (!app.getId().equals(applicationId) && app.getStatus() == AppStatus.EVALUATED_YES) {
                app.setStatus(AppStatus.REJECTED_AFTER_CASTING);
                mailer.send(Mail.withText(
                        app.getEmail(),
                        "Paradies — Update on your application",
                        "Hi " + app.getName() + ",\n\n"
                        + "Thank you for coming to the casting at Kirchgasse 36. "
                        + "Unfortunately, we've decided to go with another candidate this time.\n\n"
                        + "We wish you all the best!\n\n"
                        + "Best,\nKleines Paradies WG"
                ));
            }
        }
    }
}
