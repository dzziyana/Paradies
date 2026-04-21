package dev.azaronak.paradies.casting.presentation;

import dev.azaronak.paradies.casting.entities.CalendarEntry;
import dev.azaronak.paradies.casting.entities.CalendarEntryCategory;
import dev.azaronak.paradies.casting.entities.Resident;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Path("/calendar-entries")
public class CalendarEntryResource {

    public record CreateCalendarEntryRequest(
            String title,
            LocalDate startDate,
            LocalDate endDate,
            String time,
            int color,
            CalendarEntryCategory category,
            UUID residentId // optional — links absences to a resident
    ) {}

    @GET
    public List<CalendarEntry> list() {
        return CalendarEntry.<CalendarEntry>listAll().stream()
                .sorted(Comparator.comparing(CalendarEntry::getStartDate))
                .toList();
    }

    @POST
    @Transactional
    public UUID create(CreateCalendarEntryRequest req) {
        Resident resident = null;
        if (req.residentId() != null) {
            resident = Resident.findById(req.residentId());
            if (resident == null) throw new NotFoundException("Resident not found");
        }
        CalendarEntry e = CalendarEntry.create(
                req.title(), req.startDate(), req.endDate(),
                req.time(), req.color(), req.category(), resident
        );
        e.persist();
        return e.getId();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") UUID id) {
        CalendarEntry e = CalendarEntry.findById(id);
        if (e == null) throw new NotFoundException("Calendar entry not found");
        e.delete();
    }
}
