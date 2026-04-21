package dev.azaronak.paradies.casting;

import dev.azaronak.paradies.casting.entities.Resident;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;
import org.mindrot.jbcrypt.BCrypt;

import java.time.LocalDate;

/**
 * Seeds two demo resident accounts in dev mode so you can log in immediately.
 * Only runs if the database is empty. These credentials are for local development only —
 * they are never seeded in production.
 *
 * Demo credentials:
 *   alice@paradies.dev / paradies
 *   bob@paradies.dev   / paradies
 */
@ApplicationScoped
public class DevSeedData {

    @Transactional
    void onStart(@Observes StartupEvent ev) {
        if (Resident.count() > 0) return;

        Resident alice = Resident.create(
                "Alice",
                LocalDate.of(2000, 5, 12),
                "301",
                "alice@paradies.dev"
        );
        alice.setPasswordHash(BCrypt.hashpw("paradies", BCrypt.gensalt()));
        alice.clearInviteToken();
        alice.persist();

        Resident bob = Resident.create(
                "Bob",
                LocalDate.of(1999, 8, 20),
                "302",
                "bob@paradies.dev"
        );
        bob.setPasswordHash(BCrypt.hashpw("paradies", BCrypt.gensalt()));
        bob.clearInviteToken();
        bob.persist();

        System.out.println("══════════════════════════════════════════");
        System.out.println("  DEV SEED: Demo accounts created");
        System.out.println("  alice@paradies.dev / paradies");
        System.out.println("  bob@paradies.dev   / paradies");
        System.out.println("══════════════════════════════════════════");


    }
}
