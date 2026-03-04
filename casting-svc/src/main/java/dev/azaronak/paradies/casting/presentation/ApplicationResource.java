package dev.azaronak.paradies.casting.presentation;

import dev.azaronak.paradies.casting.entities.AppEvaluation;
import dev.azaronak.paradies.casting.entities.Application;
import dev.azaronak.paradies.casting.entities.Casting;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;

import java.util.UUID;

@Path("/castings/{castingId}/application")
public class ApplicationResource {

    @PathParam("castingId")
    private UUID castingId;

    public record ApplicationRequest(
            String name,
            String occupation,
            int age,
            String university,
            String major,
            String otherOccupation,
            String email,
            String phone,
            String letter
    ) {
    }

    public record EvaluationRequest(
            AppEvaluation evaluation
    ) {
    }

    public record ApplicationResponse() {
    }

    @POST
    @Transactional
    public UUID apply(ApplicationRequest request) {
        Casting casting = Casting.findById(castingId);
        Application application = Application.create(
                request.name(),
                request.occupation(),
                request.age(),
                request.university(),
                request.major(),
                request.otherOccupation(),
                request.email(),
                request.phone(),
                request.letter()
        );
        casting.addApplication(application);
        application.persist();
        return application.getId();
    }

    @PUT
    @Path("/{applicationId}/evaluation")
    @Transactional
    public void setEvaluation(
            @PathParam("applicationId") UUID applicationId,
            EvaluationRequest request
    ) {
        Application application = Application.findById(applicationId);
        if (application == null) {
            throw new NotFoundException("Application not found");
        }
        application.setEval(request.evaluation());
    }

    @GET
    public Application getAppById(UUID id) {
        return Application.findById(id);
    }
}
