#!/bin/bash

failed=0

build_all() {
  sh -c 'rush build \
    -t waffle-tutorial-hello-world \
    -t waffle-tutorial-echo \
    -t waffle-tutorial-token \
    -t waffle-tutorial-nft \
    -t waffle-tutorial-precompiled-token'
}

rebuild_all() {
  sh -c 'rush rebuild \
    -t waffle-tutorial-hello-world \
    -t waffle-tutorial-echo \
    -t waffle-tutorial-token \
    -t waffle-tutorial-nft \
    -t waffle-tutorial-precompiled-token'
}

test_all() {
  examples=(
    "hello-world"
    "echo"
    "token"
    "NFT"
    "precompiled-token"
  )

  ROOT=$(pwd)

  for e in "${examples[@]}"
  do
    echo "--------------- Running Waffle tests ${e} ---------------"

    cd  "${ROOT}/${e}"

    if ! yarn test; then
      ((failed=failed+1))
    fi

    echo ""
  done

  echo "+++++++++++++++++++++++"
  echo "Number of failed waffle tests: $failed"
  echo "+++++++++++++++++++++++"
}

build_and_test() {
  build_all
  test_all

  exit $failed
}

case "$1" in
  "build") build_all ;;
  "rebuild") rebuild_all ;;
  "test") test_all ;;
  "build_and_test") build_and_test ;;
  *) build_and_test ;;
esac
