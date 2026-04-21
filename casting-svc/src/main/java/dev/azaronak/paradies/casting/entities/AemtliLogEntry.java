package dev.azaronak.paradies.casting.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class AemtliLogEntry extends PanacheEntityBase {
    @Id
    UUID id;

    @ManyToOne
    Aemtli aemtli;

    @ManyToOne
    Resident changedBy;

    LocalDateTime changedAt;

    /** Comma-separated resident UUIDs before the change */
    String previousResidentIds;

    /** Comma-separated resident UUIDs after the change */
    String newResidentIds;

    public static AemtliLogEntry create(Aemtli aemtli, Resident changedBy,
                                        String previousResidentIds, String newResidentIds) {
        AemtliLogEntry e = new AemtliLogEntry();
        e.id = UUID.randomUUID();
        e.aemtli = aemtli;
        e.changedBy = changedBy;
        e.changedAt = LocalDateTime.now();
        e.previousResidentIds = previousResidentIds;
        e.newResidentIds = newResidentIds;
        return e;
    }

    protected AemtliLogEntry() {}

    public UUID getId() { return id; }
    public Aemtli getAemtli() { return aemtli; }
    public Resident getChangedBy() { return changedBy; }
    public LocalDateTime getChangedAt() { return changedAt; }
    public String getPreviousResidentIds() { return previousResidentIds; }
    public String getNewResidentIds() { return newResidentIds; }
}
