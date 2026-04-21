package dev.azaronak.paradies.casting.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.LinkedList;
import java.util.List;
import java.util.UUID;

@Entity
public class Application extends PanacheEntityBase {
    @Id
    private UUID id;

    @ManyToOne
    @JsonIgnore
    private Casting casting;

    private String name;
    private String occupation;
    private int age;
    private String university;
    private String major;
    private String otherOccupation;
    private String email;
    private String phone;
    private String letter;
    private AppStatus status;

    private String pronouns;

    @Column(columnDefinition = "TEXT")
    private String profilePicture;
    private String profilePictureMimeType;

    @Column(columnDefinition = "TEXT")
    private String additionalPictures;       // pipe-separated base64 strings
    @Column(columnDefinition = "TEXT")
    private String additionalPictureMimeTypes; // pipe-separated mime types

    private String extractedKeywords;

    @OneToMany(orphanRemoval = true)
    @JoinColumn(name = "application_id")
    @JsonIgnore
    private List<Evaluation> evaluations;

    public void addEval(Evaluation evaluation) {
        this.evaluations.add(evaluation);
    }

    @JsonIgnore
    public Evaluation getLastEvaluation() {
        return this.evaluations.getLast();
    }

    public static Application create(
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
            String additionalPictures,
            String additionalPictureMimeTypes,
            String extractedKeywords
    ) {
        return new Application(
                UUID.randomUUID(),
                name,
                occupation,
                age,
                university,
                major,
                otherOccupation,
                email,
                phone,
                letter,
                pronouns,
                profilePicture,
                profilePictureMimeType,
                additionalPictures,
                additionalPictureMimeTypes,
                extractedKeywords,
                new LinkedList<Evaluation>()
        );
    }

    private Application(
            UUID id,
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
            String additionalPictures,
            String additionalPictureMimeTypes,
            String extractedKeywords,
            List<Evaluation> evals
    ) {
        this.id = id;
        this.name = name;
        this.occupation = occupation;
        this.age = age;
        this.university = university;
        this.major = major;
        this.otherOccupation = otherOccupation;
        this.email = email;
        this.phone = phone;
        this.letter = letter;
        this.pronouns = pronouns;
        this.profilePicture = profilePicture;
        this.profilePictureMimeType = profilePictureMimeType;
        this.additionalPictures = additionalPictures;
        this.additionalPictureMimeTypes = additionalPictureMimeTypes;
        this.extractedKeywords = extractedKeywords;
        this.evaluations = evals;
    }

    // Required by Hibernate.
    protected Application() {
    }

    public void setCasting(Casting casting) {
        this.casting = casting;
    }

    public UUID getId() { return this.id; }
    public String getName() { return this.name; }
    public String getOccupation() { return this.occupation; }
    public int getAge() { return this.age; }
    public String getUniversity() { return this.university; }
    public String getMajor() { return this.major; }
    public String getOtherOccupation() { return this.otherOccupation; }
    public String getPronouns() { return this.pronouns; }
    public AppStatus getStatus() { return this.status; }
    public String getProfilePicture() { return this.profilePicture; }
    public String getProfilePictureMimeType() { return this.profilePictureMimeType; }
    public String getAdditionalPictures() { return this.additionalPictures; }
    public String getAdditionalPictureMimeTypes() { return this.additionalPictureMimeTypes; }
    public String getExtractedKeywords() { return this.extractedKeywords; }
    public String getLetter() { return this.letter; }
    public String getEmail() { return this.email; }
    public String getPhone() { return this.phone; }
    @JsonIgnore
    public List<Evaluation> getEvaluations() { return this.evaluations; }
    public void setStatus(AppStatus status) { this.status = status; }
}
