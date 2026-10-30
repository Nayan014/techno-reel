# Project scenes

New custom scenes belong in `projects/<slug>/working/scenes/`. The selected project
is mapped into the scene loader by the render and Studio commands.

Each `<Name>.tsx` exports `const <Name>`. Do not register project scenes in the kit.
Import kit helpers using `../../../../src/` (for example `../../../../src/components/ui`).
A custom scene cannot use an existing kit scene name.

This directory remains only as the bundler context anchor and a legacy migration location.
Assign any old `.tsx` files here to the correct project before rendering, and update imports.
