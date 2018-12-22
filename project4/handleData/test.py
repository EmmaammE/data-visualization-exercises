# -*- coding: utf-8 -*-
"""
Created on Thu Dec 20 21:00:48 2018

@author: zhuzhu
"""

# encoding=utf-8
import jieba
import jieba.posseg as pseg
import re

# 文件路径说明：
# 源文件:全唐诗.txt
# 中间结果:result.txt
# 停用词表:stopwords.txt
# 结果:result.csv

def readFile(file):
    content = ""
    fo = open(file)
    for line in fo.readlines():
        content+=line.strip()
    fo.close()
    return content

#加载停用词表
def stopWordsList(filepath):
    stopWords = [line.strip() for line in open(filepath,'r').readlines()]
    return stopWords

f = open("全唐诗.txt",encoding='gbk',errors="ignore")
line = f.readline()
fo = open("result.txt",'w')
toStore = ['ns','a','n','ng','n','nz','nr','nm','q','m','zg','tg']
while line:
    if line.find('\u94b1\u5efa\u6587\u5236\u4f5c')!=-1:
        line = f.readline(),
        continue
    matchObj_ = re.match(r'.*\u5377[0-9]',line)
    if matchObj_:
        line = f.readline()
        continue
    matchObj = re.match(r'.*\u5377.*[一|二|三|四|五|六|七|八|九]',line)
    if matchObj:
        line = f.readline()
        continue

#    .translate(str.maketrans(' ',' ','。，')),cut_all=True
    seg = jieba.cut(line,cut_all = True)
#    temp = "/".join(seg)
    words = pseg.cut(line.strip())
    temp = ""
    for x in words:
#        print(x.word+x.flag+" ")
        if x.flag in toStore:
            temp+= x.word+'/'

    fo.writelines(temp)
    line = f.readline()
#    print("/ ".join(seg))

f.close()
fo.close()

#result
wordList = []
#词频
wordCount = {}

rawContent = readFile("result.txt")
wordList = rawContent.split('/')
stopWords = stopWordsList('stopwords.txt')
for item in wordList:
#    if item == '，':
#        continue
    if item.strip() == '':
        continue
    if item not in stopWords:
        if item not in wordCount:
            wordCount[item] = 1
        else:
            wordCount[item] += 1


#print(wordCount)
class WordItem:
    name = ''
    num = 0
    def __init__(self,n,s):
        self.name = n
        self.num = s
    def  __lt__(self,other):
        return self.num < other.num
    def speak(self):
        print(self.name," ",self.num)
    def writeInCSV(self):
        return self.name+","+ str(self.num)
#
wordItemArray = []
for key in wordCount:
    tmp = WordItem(key,wordCount[key])
#    tmp.speak()
    wordItemArray.append(tmp)
wordItemArray.sort(reverse = True)

#print(wordItemArray)

wf = open("result.csv",'w')
wf.write("name,num\n")
for item in wordItemArray:
    wf.write(item.writeInCSV())
    wf.write('\n')
wf.close()