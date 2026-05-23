import argparse

from .model_discovery import discover_models
from .reporting import generate_report
from .runners import list_experiments, run_experiment, validate_experiment


def main() -> None:
    parser = argparse.ArgumentParser(prog="strangeloop")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list")
    validate = sub.add_parser("validate")
    validate.add_argument("experiment_dir")

    run = sub.add_parser("run")
    run.add_argument("experiment_dir")
    run.add_argument("--model", required=True)

    models = sub.add_parser("models")
    models.add_argument(
        "--provider",
        action="append",
        dest="providers",
        help="Provider to query (repeat flag for multiple): openai-compatible, anthropic, google, ollama, azure-openai, bedrock",
    )

    report = sub.add_parser("report")
    report.add_argument("experiment_dir")

    args = parser.parse_args()
    had_error = False
    if args.command == "list":
        for name in list_experiments():
            print(name)
    elif args.command == "validate":
        errors = validate_experiment(args.experiment_dir)
        if errors:
            print("INVALID")
            for err in errors:
                print(f"- {err}")
            raise SystemExit(1)
        print("VALID")
    elif args.command == "run":
        out = run_experiment(args.experiment_dir, args.model)
        print(f"Wrote {out}")
    elif args.command == "models":
        catalogs = discover_models(args.providers)
        for catalog in catalogs:
            print(f"[{catalog.provider}]")
            if catalog.error:
                had_error = True
                print(f"ERROR: {catalog.error}")
                continue
            if not catalog.models:
                print("No models returned.")
                continue
            for model in catalog.models:
                print(f"{catalog.provider}:{model}")
    elif args.command == "report":
        out = generate_report(args.experiment_dir)
        print(f"Wrote {out}")

    if args.command == "models" and had_error:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
