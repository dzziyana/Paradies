package dev.azaronak.paradies.casting.presentation;

import dev.azaronak.paradies.casting.entities.CalendarEntry;
import dev.azaronak.paradies.casting.entities.CalendarEntryCategory;
import dev.azaronak.paradies.casting.entities.CleaningDuty;
import dev.azaronak.paradies.casting.entities.Resident;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Path("/cleaning-duties")
public class CleaningDutyResource {

    private static final String SEMESTER_CLEANING = "Semester Cleaning";

    public record CreateCleaningDutyRequest(UUID residentId, LocalDate dueDate, String area) {}

    public record ProposedAssignment(LocalDate dueDate, String area, UUID residentId, String residentName) {}

    @GET
    public List<CleaningDuty> list() {
        return CleaningDuty.<CleaningDuty>listAll().stream()
                .sorted(Comparator.comparing(CleaningDuty::getDueDate))
                .toList();
    }

    @POST
    @Transactional
    public UUID create(CreateCleaningDutyRequest req) {
        Resident r = Resident.findById(req.residentId());
        if (r == null) throw new NotFoundException("Resident not found");
        CleaningDuty d = CleaningDuty.create(r, req.dueDate(), req.area());
        d.persist();
        return d.getId();
    }

    @DELETE
    @Transactional
    public void deleteAll() {
        CleaningDuty.deleteAll();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") UUID id) {
        CleaningDuty d = CleaningDuty.findById(id);
        if (d == null) throw new NotFoundException("Cleaning duty not found");
        d.delete();
    }

    @PUT
    @Path("/{id}/complete")
    @Transactional
    public void complete(@PathParam("id") UUID id) {
        CleaningDuty d = CleaningDuty.findById(id);
        if (d == null) throw new NotFoundException("Cleaning duty not found");
        d.markCompleted();
    }

    @PUT
    @Path("/{id}/uncomplete")
    @Transactional
    public void uncomplete(@PathParam("id") UUID id) {
        CleaningDuty d = CleaningDuty.findById(id);
        if (d == null) throw new NotFoundException("Cleaning duty not found");
        d.markNotDone();
    }

    /**
     * Generate a proposed cleaning plan for a month.
     * Equal share for every resident; each person's duties are placed only on dates they are available.
     * Algorithm: for each slot, pick the available resident with the fewest assignments so far.
     */
    @GET
    @Path("/generate")
    public List<ProposedAssignment> generate(@QueryParam("year") int year, @QueryParam("month") int month) {
        YearMonth ym = YearMonth.of(year, month);
        List<Resident> residents = Resident.listAll();
        if (residents.isEmpty()) return List.of();

        // Collect all ABSENCE calendar entries that overlap this month
        LocalDate monthStart = ym.atDay(1);
        LocalDate monthEnd = ym.atEndOfMonth();
        List<CalendarEntry> absences = CalendarEntry.<CalendarEntry>list("category", CalendarEntryCategory.ABSENCE)
                .stream()
                .filter(e -> e.getResident() != null)
                .filter(e -> !e.getEndDate().isBefore(monthStart) && !e.getStartDate().isAfter(monthEnd))
                .toList();

        // Build absence lookup: residentId -> set of absent dates in this month
        Map<UUID, Set<LocalDate>> absentDates = new HashMap<>();
        for (CalendarEntry a : absences) {
            LocalDate from = a.getStartDate().isBefore(monthStart) ? monthStart : a.getStartDate();
            LocalDate to = a.getEndDate().isAfter(monthEnd) ? monthEnd : a.getEndDate();
            Set<LocalDate> dates = absentDates.computeIfAbsent(a.getResident().getId(), k -> new HashSet<>());
            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                dates.add(d);
            }
        }

        // Generate slots: Wednesday -> 1 slot, Sunday -> 2 slots (Kitchen, Living Room)
        record Slot(LocalDate date, String area) {}
        List<Slot> slots = new ArrayList<>();
        for (LocalDate d = monthStart; !d.isAfter(monthEnd); d = d.plusDays(1)) {
            if (d.getDayOfWeek() == DayOfWeek.WEDNESDAY) {
                slots.add(new Slot(d, "Wednesday"));
            } else if (d.getDayOfWeek() == DayOfWeek.SUNDAY) {
                slots.add(new Slot(d, "Sunday Kitchen"));
                slots.add(new Slot(d, "Sunday Living Room"));
            }
        }

        // Factor in past uncompleted duties: residents who didn't clean get a penalty (start with fewer "credits")
        // We look at duties from the last 3 months that are past due but not completed
        LocalDate penaltyLookback = monthStart.minusMonths(3);
        Map<UUID, Integer> penalty = new HashMap<>();
        CleaningDuty.<CleaningDuty>listAll().stream()
                .filter(d -> !d.isCompleted())
                .filter(d -> d.getDueDate().isBefore(monthStart) && d.getDueDate().isAfter(penaltyLookback))
                .filter(d -> !SEMESTER_CLEANING.equals(d.getArea()))
                .forEach(d -> penalty.merge(d.getAssignedResident().getId(), 1, Integer::sum));

        // Greedy assignment: for each slot, pick available resident with fewest assignments
        // Penalty offsets the count so penalized residents appear to have done more (get picked less early on)
        Map<UUID, Integer> counts = new HashMap<>();
        for (Resident r : residents) counts.put(r.getId(), -penalty.getOrDefault(r.getId(), 0));

        List<ProposedAssignment> result = new ArrayList<>();
        for (Slot slot : slots) {
            Resident best = null;
            int bestCount = Integer.MAX_VALUE;
            for (Resident r : residents) {
                Set<LocalDate> absent = absentDates.getOrDefault(r.getId(), Set.of());
                if (absent.contains(slot.date())) continue;
                int c = counts.get(r.getId());
                if (c < bestCount) {
                    bestCount = c;
                    best = r;
                }
            }
            if (best != null) {
                counts.merge(best.getId(), 1, Integer::sum);
                result.add(new ProposedAssignment(slot.date(), slot.area(), best.getId(), best.getName()));
            }
        }

        return result;
    }
}
