package dev.azaronak.paradies.casting.presentation;

import dev.azaronak.paradies.casting.entities.AppStatus;
import dev.azaronak.paradies.casting.entities.Evaluation;
import dev.azaronak.paradies.casting.entities.EvaluationCategory;
import dev.azaronak.paradies.casting.entities.Application;
import dev.azaronak.paradies.casting.entities.Casting;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;

import java.util.List;
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
            EvaluationCategory evaluation,
            UUID userId
    ) {
    }

    public record ApplicationOverview(
            UUID id,
            String name,
            String occupation,
            int age,
            String university,
            String major,
            AppStatus status
    ) {}

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
            EvaluationRequest req
    ) {
        Application application = Application.findById(applicationId);
        if (application == null) {
            throw new NotFoundException("Application not found");
        }
        Evaluation newEval = Evaluation.create(req.userId(), req.evaluation());
        newEval.persist();
        application.addEval(newEval);
    }

    @GET
    public Application getAppById(@QueryParam("id") UUID id) {
        return Application.findById(id);
    }

    @GET
    @Path("s")
    public List<ApplicationOverview> listApplications() {
        Casting casting = Casting.findById(castingId);
        if (casting == null) throw new NotFoundException("Casting not found");
        return casting.getApplications().stream()
                .map(a -> new ApplicationOverview(
                        a.getId(),
                        a.getName(),
                        a.getOccupation(),
                        a.getAge(),
                        a.getUniversity(),
                        a.getMajor(),
                        a.getStatus()
                ))
                .toList();
    }
}
