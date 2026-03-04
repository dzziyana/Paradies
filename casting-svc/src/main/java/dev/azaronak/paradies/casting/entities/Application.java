package dev.azaronak.paradies.casting.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import java.util.UUID;

@Entity
public class Application extends PanacheEntityBase {
    @Id
    private UUID id;

    @ManyToOne
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

    @Enumerated(EnumType.STRING)
    private AppEvaluation evaluation;

    public void setEval(AppEvaluation evaluation) {
        this.evaluation = evaluation;
    }

    public AppEvaluation getEvaluation() {
        return this.evaluation;
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
            String letter
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
                letter
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
            String letter
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
    }

    // Required by Hibernate.
    protected Application() {
    }

    public void setCasting(Casting casting) {
        this.casting = casting;
    }

    public UUID getId() {
        return this.id;
    }
}
