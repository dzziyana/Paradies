package dev.azaronak.paradies.casting.entities;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class Evaluation extends PanacheEntityBase {
    @Id
    UUID id;
    UUID authorId;
    EvaluationCategory judgement;
    LocalDateTime time;

    public static Evaluation create(UUID userId, EvaluationCategory judgement){
        return new Evaluation(UUID.randomUUID(), userId, judgement, LocalDateTime.now());
    }

    private Evaluation(UUID evalId, UUID authorId, EvaluationCategory judgement, LocalDateTime time) {
        this.id = evalId;
        this.authorId = authorId;
        this.judgement = judgement;
        this.time = time;
    }

    //for hibernate purposes:
    public Evaluation() {
    }
}
