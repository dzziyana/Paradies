package dev.azaronak.paradies.casting.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
public class Aemtli extends PanacheEntityBase {
    @Id
    UUID id;

    String name;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "aemtli_resident")
    List<Resident> assignedResidents = new ArrayList<>();

    public static Aemtli create(String name) {
        Aemtli a = new Aemtli();
        a.id = UUID.randomUUID();
        a.name = name;
        return a;
    }

    protected Aemtli() {}

    public UUID getId() { return id; }
    public String getName() { return name; }
    public List<Resident> getAssignedResidents() { return assignedResidents; }
    public void setAssignedResidents(List<Resident> residents) { this.assignedResidents = residents; }
}
