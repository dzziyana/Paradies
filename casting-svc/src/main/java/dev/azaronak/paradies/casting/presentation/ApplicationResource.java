package dev.azaronak.paradies.casting.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.azaronak.paradies.casting.auth.AuthenticatedUser;
import dev.azaronak.paradies.casting.entities.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Path("/castings/{castingId}/application")
public class ApplicationResource {

    @PathParam("castingId")
    private UUID castingId;

    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @ConfigProperty(name = "nlp.service.url", defaultValue = "http://localhost:8090")
    String nlpServiceUrl;

    @Inject
    AuthenticatedUser authenticatedUser;

    public record ApplicationRequest(
            String name,
            String occupation,
            int age,
            String university,
            String major,
            String otherOccupation,
            String email,
            String phone,
            String letter,
            String pronouns,
            String profilePicture,
            String profilePictureMimeType,
            List<String> additionalPictures,
            List<String> additionalPictureMimeTypes
    ) {
    }

    public record EvaluationRequest(
            EvaluationCategory evaluation
    ) {
    }

    public record ApplicationOverview(
            UUID id,
            String name,
            String occupation,
            int age,
            String university,
            String major,
            AppStatus status,
            boolean hasProfilePicture,
            String extractedKeywords,
            int yesCount,
            int maybeCount,
            int noCount,
            int vetoCount
    ) {}

    public record ApplyResponse(UUID applicationId, String magicLinkToken) {}

    private String fetchKeywords(String letter) {
        try {
            String body = MAPPER.writeValueAsString(Map.of("text", letter));
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(nlpServiceUrl + "/extract-keywords"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
            return MAPPER.readTree(res.body()).path("keywords").asText(null);
        } catch (Exception e) {
            return null; // NLP service unavailable — continue without keywords
        }
    }

    @POST
    @Transactional
    public ApplyResponse apply(ApplicationRequest request) {
        String keywords = fetchKeywords(request.letter());

        // Join additional pictures into pipe-delimited strings for storage
        String additionalPics = request.additionalPictures() != null
                ? String.join("|", request.additionalPictures()) : null;
        String additionalMimes = request.additionalPictureMimeTypes() != null
                ? String.join("|", request.additionalPictureMimeTypes()) : null;

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
                request.letter(),
                request.pronouns(),
                request.profilePicture(),
                request.profilePictureMimeType(),
                additionalPics,
                additionalMimes,
                keywords
        );
        casting.addApplication(application);
        application.persist();

        MagicLink magicLink = MagicLink.create(application, casting);
        magicLink.persist();

        return new ApplyResponse(application.getId(), magicLink.getToken());
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
        UUID currentUserId = authenticatedUser.get().getId();

        // Remove ALL existing evaluations by this author (orphanRemoval handles DB delete)
        application.getEvaluations().removeIf(e -> e.getAuthorId().equals(currentUserId));

        // Create the new evaluation
        Evaluation newEval = Evaluation.create(currentUserId, req.evaluation());
        newEval.persist();
        application.addEval(newEval);
    }

    @DELETE
    @Path("/{applicationId}/evaluation")
    @Transactional
    public void retractEvaluation(@PathParam("applicationId") UUID applicationId) {
        Application application = Application.findById(applicationId);
        if (application == null) throw new NotFoundException("Application not found");
        UUID currentUserId = authenticatedUser.get().getId();
        application.getEvaluations().removeIf(e -> e.getAuthorId().equals(currentUserId));
    }

    @GET
    public Application getAppById(@QueryParam("id") UUID id) {
        return Application.findById(id);
    }

    public record EvaluationOverview(
            UUID id,
            UUID authorId,
            String authorName,
            EvaluationCategory judgement,
            LocalDateTime time
    ) {}

    @GET
    @Path("/{applicationId}/evaluations")
    @Transactional
    public List<EvaluationOverview> listEvaluations(@PathParam("applicationId") UUID applicationId) {
        Application application = Application.findById(applicationId);
        if (application == null) throw new NotFoundException("Application not found");
        return application.getEvaluations().stream()
                .sorted((a, b) -> b.getTime().compareTo(a.getTime()))
                .map(e -> {
                    Resident author = Resident.findById(e.getAuthorId());
                    String name = author != null ? author.getName() : "Unknown";
                    return new EvaluationOverview(e.getId(), e.getAuthorId(), name, e.getJudgement(), e.getTime());
                })
                .toList();
    }

    @GET
    @Path("s")
    @Transactional
    public List<ApplicationOverview> listApplications() {
        Casting casting = Casting.findById(castingId);
        if (casting == null) throw new NotFoundException("Casting not found");
        List<Application> apps = Application.find("casting.id", castingId).list();
        return apps.stream()
                .map(a -> {
                    List<Evaluation> evals = a.getEvaluations() != null ? a.getEvaluations() : List.of();
                    int yes = 0, maybe = 0, no = 0, veto = 0;
                    for (Evaluation e : evals) {
                        switch (e.getJudgement()) {
                            case YES, FRIEND -> yes++;
                            case MAYBE -> maybe++;
                            case NO, NOT_WOKO -> no++;
                            case VETO -> veto++;
                        }
                    }
                    return new ApplicationOverview(
                            a.getId(),
                            a.getName(),
                            a.getOccupation(),
                            a.getAge(),
                            a.getUniversity(),
                            a.getMajor(),
                            a.getStatus(),
                            a.getProfilePicture() != null,
                            a.getExtractedKeywords(),
                            yes, maybe, no, veto
                    );
                })
                .toList();
    }
}
