package dev.azaronak.paradies.casting.presentation;

import dev.azaronak.paradies.casting.entities.Resident;
import io.smallrye.common.annotation.Blocking;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Path("/residents")
public class ResidentResource {

    public record CreateResidentRequest(String name, LocalDate birthday, String roomNumber, String email) {}
    public record CreateResidentResponse(UUID id, String inviteToken) {}
    public record UpdateResidentRequest(String name, LocalDate birthday, String roomNumber, String email) {}

    @GET
    @Blocking
    public List<Resident> list() {
        return Resident.listAll();
    }

    @POST
    @Transactional
    public CreateResidentResponse create(CreateResidentRequest req) {
        Resident r = Resident.create(req.name(), req.birthday(), req.roomNumber(), req.email());
        r.persist();
        return new CreateResidentResponse(r.getId(), r.getInviteToken());
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public void update(@PathParam("id") UUID id, UpdateResidentRequest req) {
        Resident r = Resident.findById(id);
        if (r == null) throw new NotFoundException("Resident not found");
        r.updateInfo(req.name(), req.birthday(), req.roomNumber(), req.email());
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") UUID id) {
        Resident r = Resident.findById(id);
        if (r == null) throw new NotFoundException("Resident not found");
        r.delete();
    }

    @GET
    @Path("/upcoming-birthdays")
    @Blocking
    public List<UpcomingBirthday> upcomingBirthdays() {
        LocalDate today = LocalDate.now();
        return Resident.<Resident>listAll().stream()
                .map(r -> {
                    LocalDate nextBday = r.getBirthday().withYear(today.getYear());
                    if (nextBday.isBefore(today)) nextBday = nextBday.plusYears(1);
                    long daysUntil = java.time.temporal.ChronoUnit.DAYS.between(today, nextBday);
                    return new UpcomingBirthday(r.getId(), r.getName(), r.getBirthday(), r.getRoomNumber(), daysUntil);
                })
                .sorted(Comparator.comparingLong(UpcomingBirthday::daysUntil))
                .toList();
    }

    public record UpcomingBirthday(UUID id, String name, LocalDate birthday, String roomNumber, long daysUntil) {}
}
