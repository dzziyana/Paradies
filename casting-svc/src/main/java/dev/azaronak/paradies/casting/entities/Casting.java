package dev.azaronak.paradies.casting.entities;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.*;

@Entity
public class Casting extends PanacheEntityBase {
    @Id
    UUID id;
    LocalDateTime time;
    //hibernate requires lists lowk
    @OneToMany(mappedBy = "casting")
    Set<Application> applications;

    public UUID getId() {
        return id;
    }

    public static Casting create(LocalDateTime time){
        return new Casting(UUID.randomUUID(), time, new HashSet<>());
    }

    private Casting(UUID id, LocalDateTime time, Set<Application> applications) {
        this.id = id;
        this.time = time;
        this.applications = applications;
    }

    protected Casting() {
    }

    public void addApplication(Application app){
        this.applications.add(app);
        app.setCasting(this);
    }

    public Set<Application> getApplications() {
        return this.applications;
    }
}
