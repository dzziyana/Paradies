package dev.azaronak.paradies.casting.presentation;

import dev.azaronak.paradies.casting.entities.AppEvaluation;
import dev.azaronak.paradies.casting.entities.Application;
import dev.azaronak.paradies.casting.entities.Casting;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;

import java.time.LocalDateTime;
import java.util.UUID;

@Path("/castings/{castingId}")
public class CastingResource {

    @POST
    @Transactional
    public UUID createCasting(CreateCastingRequest req){
        Casting casting = Casting.create(req.time);
        casting.persist();
        return casting.getId();
    }

    public record CreateCastingRequest(LocalDateTime time) {
    }

    @GET
    public String getCasting(@PathParam("castingId") UUID castingId) {
        Casting casting = Casting.findById(castingId);
        var applications = casting.getApplications();
        return applications.stream().findFirst().get().getId().toString();
    }
}
