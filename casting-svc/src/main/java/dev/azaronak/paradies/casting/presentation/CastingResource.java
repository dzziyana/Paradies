package dev.azaronak.paradies.casting.presentation;

import dev.azaronak.paradies.casting.entities.Casting;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Path("/castings")
public class CastingResource {

    @GET
    public List<Casting> listCastings() {
        return Casting.<Casting>listAll().stream()
                .sorted((a, b) -> b.getMoveInDate().compareTo(a.getMoveInDate()))
                .toList();
    }

    @GET
    @Path("/active/applications")
    public List<Casting> listActiveApplications() {
        LocalDate today = LocalDate.now();
        return Casting.<Casting>listAll().stream()
                .filter(c -> !c.getMoveInDate().isBefore(today))
                .sorted((a, b) -> a.getMoveInDate().compareTo(b.getMoveInDate()))
                .toList();
    }

    @POST
    @Path("/{castingId}")
    @Transactional
    public UUID createCasting(@PathParam("castingId") UUID castingId, CreateCastingRequest req) {
        Casting casting = Casting.create(req.moveInDate(), req.moveOutDate(), req.replacedPersonName(), req.applicationUntil());
        casting.persist();
        return casting.getId();
    }

    public record CreateCastingRequest(
            LocalDate moveInDate,
            LocalDate moveOutDate,
            String replacedPersonName,
            LocalDate applicationUntil
    ) {}

    @GET
    @Path("/{castingId}")
    public String getCasting(@PathParam("castingId") UUID castingId) {
        Casting casting = Casting.findById(castingId);
        if (casting == null) throw new NotFoundException("Casting not found");
        return casting.getApplications().stream()
                .findFirst()
                .orElseThrow(() -> new NotFoundException("No applications yet"))
                .getId().toString();
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
}
