#!/bin/bash
# Script de Restauração para o Ponto Estável Principal (v1.0-checkpoint-estavel)
# Execute este script a qualquer momento para voltar exatamente para a versão estável com segurança.

echo "🔄 Restaurando projeto para o ponto principal estável (v1.0-checkpoint-estavel)..."
git reset --hard v1.0-checkpoint-estavel
git clean -fd
echo "✅ Projeto restaurado com sucesso para a versão v1.0-checkpoint-estavel!"
