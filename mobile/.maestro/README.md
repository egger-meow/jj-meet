# Maestro E2E Tests

End-to-end tests using [Maestro](https://maestro.mobile.dev/).

## Setup

1. Install Maestro CLI:
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

2. Start the Expo dev server:
```bash
cd mobile
npx expo start
```

3. Run a single test:
```bash
maestro test .maestro/login.yaml
```

4. Run all tests:
```bash
maestro test .maestro/
```

## Test Files

| File | Description |
|------|-------------|
| `login.yaml` | Tests login flow |
| `swipe.yaml` | Tests swipe/discover flow |

## Writing Tests

Maestro uses YAML syntax. Common commands:

```yaml
- launchApp                    # Launch the app
- tapOn: "Button Text"         # Tap by text
- tapOn: { id: "test-id" }     # Tap by testID
- inputText: "text"            # Type text
- assertVisible: "Text"        # Assert text visible
- swipe: { direction: RIGHT }  # Swipe gesture
```

## Tips

1. Add `testID` props to React Native components for reliable targeting
2. Use `assertVisible` with `timeout` for async operations
3. Run in `--continuous` mode during development:
   ```bash
   maestro test --continuous .maestro/login.yaml
   ```
