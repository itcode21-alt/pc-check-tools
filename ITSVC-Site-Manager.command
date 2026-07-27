#!/bin/bash

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  SOURCE_DIR="$(cd "$(dirname "$SOURCE")" && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  case "$SOURCE" in
    /*) ;;
    *) SOURCE="$SOURCE_DIR/$SOURCE" ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$SOURCE")" && pwd)"
exec /bin/bash "$SCRIPT_DIR/scripts/site-manager.sh"
