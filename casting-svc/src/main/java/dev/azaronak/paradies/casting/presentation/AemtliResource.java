package dev.azaronak.paradies.casting.presentation;

import dev.azaronak.paradies.casting.auth.AuthenticatedUser;
import dev.azaronak.paradies.casting.entities.Aemtli;
import dev.azaronak.paradies.casting.entities.AemtliLogEntry;
import dev.azaronak.paradies.casting.entities.Resident;
import io.quarkus.panache.common.Sort;
import io.smallrye.common.annotation.Blocking;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Path("/aemtli")
public class AemtliResource {

    @Inject
    AuthenticatedUser authenticatedUser;

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public record ResidentRef(UUID id, String name, String roomNumber) {}
    public record LastChangeInfo(ResidentRef changedBy, LocalDateTime changedAt) {}
    public record AemtliView(UUID id, String name, List<ResidentRef> assignedResidents, LastChangeInfo lastChange) {}
    public record CreateAemtliRequest(String name) {}
    public record UpdateAssignmentsRequest(List<UUID> residentIds) {}

    // ── Endpoints ─────────────────────────────────────────────────────────────

    @GET
    @Blocking
    public List<AemtliView> list() {
        return Aemtli.<Aemtli>listAll().stream()
                .sorted(Comparator.comparing(Aemtli::getName))
                .map(this::toView)
                .toList();
    }

    @POST
    @Transactional
    public UUID create(CreateAemtliRequest req) {
        Aemtli a = Aemtli.create(req.name().trim());
        a.persist();
        return a.getId();
    }

    @PUT
    @Path("/{id}/assignments")
    @Transactional
    public AemtliView updateAssignments(@PathParam("id") UUID id, UpdateAssignmentsRequest req) {
        Aemtli a = Aemtli.findById(id);
        if (a == null) throw new NotFoundException("Aemtli not found");

        String previousIds = a.getAssignedResidents().stream()
                .map(r -> r.getId().toString())
                .collect(Collectors.joining(","));

        List<Resident> newResidents = req.residentIds().stream()
                .map(rid -> {
                    Resident r = Resident.findById(rid);
                    if (r == null) throw new NotFoundException("Resident not found: " + rid);
                    return r;
                })
                .toList();

        String newIds = newResidents.stream()
                .map(r -> r.getId().toString())
                .collect(Collectors.joining(","));

        a.setAssignedResidents(newResidents);

        if (authenticatedUser.isPresent()) {
            AemtliLogEntry.create(a, authenticatedUser.get(), previousIds, newIds).persist();
        }

        return toView(a);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") UUID id) {
        Aemtli a = Aemtli.findById(id);
        if (a == null) throw new NotFoundException("Aemtli not found");
        AemtliLogEntry.delete("aemtli", a);
        a.delete();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AemtliView toView(Aemtli a) {
        List<ResidentRef> residents = a.getAssignedResidents().stream()
                .map(r -> new ResidentRef(r.getId(), r.getName(), r.getRoomNumber()))
                .toList();

        AemtliLogEntry last = AemtliLogEntry
                .<AemtliLogEntry>find("aemtli = ?1", Sort.by("changedAt", Sort.Direction.Descending), a)
                .firstResult();

        LastChangeInfo change = last == null ? null : new LastChangeInfo(
                new ResidentRef(last.getChangedBy().getId(), last.getChangedBy().getName(), last.getChangedBy().getRoomNumber()),
                last.getChangedAt()
        );

        return new AemtliView(a.getId(), a.getName(), residents, change);
    }
}
