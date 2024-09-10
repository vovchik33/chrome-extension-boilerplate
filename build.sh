#!/usr/bin/env bash
version='0_1'
builddir='builds'
name=tabs-remover_${version}

mkdir ${builddir}
cd src
zip -r ../${builddir}/${name} *