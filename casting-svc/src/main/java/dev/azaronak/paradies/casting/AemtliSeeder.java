package dev.azaronak.paradies.casting;

import dev.azaronak.paradies.casting.entities.Aemtli;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;

import java.util.List;

/**
 * Seeds the default Ämtli on first run (production and dev).
 * Only inserts if the aemtli table is empty, so user changes are never overwritten.
 */
@ApplicationScoped
public class AemtliSeeder {

    private static final List<String> DEFAULTS = List.of(
            "Compost",
            "Cat toilet",
            "Karton / Paper",
            "Trash",
            "Finance",
            "Laundry"
    );

    @Transactional
    void onStart(@Observes StartupEvent ev) {
        if (Aemtli.count() > 0) return;
        for (String name : DEFAULTS) {
            Aemtli.create(name).persist();
        }
    }
}
