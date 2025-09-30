#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
이미지 파일 형식을 JPG로 통일하는 스크립트
restaurant_images 폴더의 모든 JPEG, PNG 파일을 JPG로 변환합니다.
"""

import os
import sys
from pathlib import Path
from PIL import Image
import shutil

def convert_images_to_jpg(source_dir="restaurant_images", backup=True):
    """
    지정된 디렉토리의 모든 이미지를 JPG 형식으로 변환합니다.
    
    Args:
        source_dir (str): 이미지가 있는 디렉토리 경로
        backup (bool): 원본 파일을 백업할지 여부
    """
    
    # 디렉토리 경로 설정
    source_path = Path(source_dir)
    
    if not source_path.exists():
        print(f"❌ 디렉토리를 찾을 수 없습니다: {source_dir}")
        return
    
    # 백업 디렉토리 생성
    if backup:
        backup_dir = source_path.parent / f"{source_dir}_backup"
        backup_dir.mkdir(exist_ok=True)
        print(f"📁 백업 디렉토리 생성: {backup_dir}")
    
    # 변환할 파일 확장자들
    target_extensions = ['.jpeg', '.png']
    
    # 변환할 파일들 찾기
    files_to_convert = []
    for ext in target_extensions:
        files_to_convert.extend(source_path.glob(f"*{ext}"))
    
    if not files_to_convert:
        print("✅ 변환할 파일이 없습니다.")
        return
    
    print(f"🔍 변환할 파일 {len(files_to_convert)}개 발견")
    
    # 변환 통계
    converted_count = 0
    error_count = 0
    skipped_count = 0
    
    for file_path in files_to_convert:
        try:
            # 새 파일명 생성 (확장자를 .jpg로 변경)
            new_filename = file_path.stem + '.jpg'
            new_file_path = file_path.parent / new_filename
            
            # 이미 JPG 파일이 존재하는 경우 스킵
            if new_file_path.exists():
                print(f"⏭️  스킵: {file_path.name} (이미 JPG 파일 존재)")
                skipped_count += 1
                continue
            
            print(f"🔄 변환 중: {file_path.name} → {new_filename}")
            
            # 백업 생성
            if backup:
                backup_file = backup_dir / file_path.name
                shutil.copy2(file_path, backup_file)
            
            # 이미지 열기 및 변환
            with Image.open(file_path) as img:
                # RGBA 모드인 경우 RGB로 변환 (투명도 제거)
                if img.mode in ('RGBA', 'LA', 'P'):
                    # 흰색 배경으로 변환
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # JPG로 저장 (품질 95%)
                img.save(new_file_path, 'JPEG', quality=95, optimize=True)
            
            # 원본 파일 삭제
            file_path.unlink()
            
            converted_count += 1
            print(f"✅ 완료: {new_filename}")
            
        except Exception as e:
            print(f"❌ 오류: {file_path.name} - {str(e)}")
            error_count += 1
    
    # 결과 요약
    print("\n" + "="*50)
    print("📊 변환 결과 요약")
    print("="*50)
    print(f"✅ 성공적으로 변환: {converted_count}개")
    print(f"⏭️  스킵된 파일: {skipped_count}개")
    print(f"❌ 오류 발생: {error_count}개")
    print(f"📁 총 처리된 파일: {len(files_to_convert)}개")
    
    if backup:
        print(f"💾 백업 위치: {backup_dir}")
    
    print("\n🎉 이미지 변환이 완료되었습니다!")

def main():
    """메인 함수"""
    print("🖼️  이미지 파일을 JPG로 변환하는 스크립트")
    print("="*50)
    
    # 현재 디렉토리에서 restaurant_images 폴더 찾기
    current_dir = Path.cwd()
    restaurant_images_dir = current_dir / "restaurant_images"
    
    if not restaurant_images_dir.exists():
        print("❌ restaurant_images 폴더를 찾을 수 없습니다.")
        print("📁 현재 디렉토리:", current_dir)
        return
    
    # 사용자 확인
    print(f"📁 대상 디렉토리: {restaurant_images_dir}")
    print("⚠️  이 작업은 원본 파일을 변경합니다.")
    
    # 백업 여부 확인
    backup_choice = input("💾 원본 파일을 백업하시겠습니까? (y/n, 기본값: y): ").strip().lower()
    backup = backup_choice != 'n'
    
    # 실행 확인
    confirm = input("🚀 변환을 시작하시겠습니까? (y/n): ").strip().lower()
    if confirm != 'y':
        print("❌ 변환이 취소되었습니다.")
        return
    
    # 변환 실행
    convert_images_to_jpg(str(restaurant_images_dir), backup)

if __name__ == "__main__":
    main()
