//
//  FileMonitorClient.cpp
//  SPYOnline
//
//  Created by Yuanfei He on 15/11/12.
//
//

#include "FileMonitorClient.h"

#include <netdb.h>
#include <sys/socket.h>
#include <fcntl.h>
#include <netdb.h>
#include <string>
#include <iostream>
#include <thread>
#include <functional>
#include <sys/errno.h>
#include <fstream>
#include <istream>
#include <sys/dir.h>
#include <sys/stat.h>
#include <sys/unistd.h>

#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"

using namespace std;
using namespace rapidjson;



FileMonitorClient* FileMonitorClient::_instance = nullptr;


FileMonitorClient* FileMonitorClient::getInstance()
{
    if (_instance==nullptr) {
        _instance = new FileMonitorClient();
        if (!_instance->init()) {
            FileMonitorClient::destoryInstance();
            return nullptr ;
        }
    }
    return _instance;
}


void FileMonitorClient::destoryInstance()
{
    delete FileMonitorClient::_instance;
    FileMonitorClient::_instance=nullptr;
    
}

bool FileMonitorClient::init()
{
    
    return true;
}


void FileMonitorClient::connect(const char* host,const char* port,bool isTest)
{
    
    struct addrinfo hints;
    struct addrinfo *servinfo;
    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;
    
    int status = getaddrinfo(host,port, &hints, &servinfo);
    if(status!=0 || servinfo==NULL)
    {
        std::cout<<"server adderss not sure！"<<std::endl;
        return;
    }
    
    sokt = socket(servinfo->ai_family, servinfo->ai_socktype, servinfo->ai_protocol);
    if(sokt==-1)
    {
        std::cout<<"socket connect fail！"<<std::endl;
        freeaddrinfo(servinfo);
        return;
    }
    
    int result= ::connect(sokt, servinfo->ai_addr, servinfo->ai_addrlen);
    if(result!=-1)
    {
        
        std::cout<<"server connect success!"<<std::endl;
        
        if (isTest) {
            const char* buf="close";
            send(sokt,buf,5, 0);
            return;
        }
        
        close_ = false;
        this->getFileList();
        
    }else{
        std::cout<<"sockect close"<<std::endl;
    }
    
    freeaddrinfo(servinfo);
}


void FileMonitorClient::getFileList()
{
    _receiveThread = std::thread(std::bind( &FileMonitorClient::loopReceiveFile, this));
    _receiveThread.detach();
    
    const char buf[]="hello";
    ssize_t len = strlen(buf);
//    std::string command = "2000";
    
    this->sendData(2000,buf, len);
    
}


FileMonitorClient::~FileMonitorClient()
{
    //clear recive buffer list
    for(auto it=reviceList_.begin();it!=reviceList_.end();++it)
    {
        delete [] (it->second);
        it->second=nullptr;
    }
    reviceList_.clear();
    this->setClose(true);
    _receiveThread.join();
    
}


void FileMonitorClient::sendData(int command, const char *buf, ssize_t len)
{
    
    
    Document d;
    d.SetObject();
    
    rapidjson::Value data;
    data.SetString(buf, (SizeType)len);
    d.AddMember("command", command, d.GetAllocator());
    d.AddMember("data", data, d.GetAllocator());
    
    StringBuffer buffer;
    Writer<StringBuffer> writer(buffer);
    d.Accept(writer);
    
    std::string senddata = buffer.GetString();
    len = senddata.size();
    std::cout<<senddata<<std::endl;
    ssize_t send_len=0;
    char bufs[10]={0};
    sprintf(bufs, "%09lu",senddata.size());
    std::string buflen(bufs);
    buflen.append(senddata);
    
    while (send_len<len) {
        send_len = send(sokt, buflen.c_str(), buflen.size(), 0);
        int err = errno;
        if (err>0) {
            std::cout<<("send packet fail")<<strerror(err)<<std::endl;
            close_=false;
            break;
        }
    }
}

void FileMonitorClient::getFileData(const std::string &path,bool isDir)
{

    if (isDir) {
      
            std::string data(path);
            ssize_t pos=0;
            std::string parent_dir;
            while (pos!=std::string::npos) {
                pos=data.find("/");
                auto dirnane = data.substr(0,pos);
                data=data.substr(pos+1,path.size());
                parent_dir.append(dirnane);
                int res= mkdir(parent_dir.c_str(),S_IRWXU);
                if (res==-1) {
                    std::cout<<"mkdir"<<dirnane<<" error"<<std::endl;
                }
                parent_dir.append("/");
            }
        
    }else{
        sendData(2002,path.c_str(),path.size());
    }
    
}


void FileMonitorClient::excuteRecvList()
{
    revice_mtx.lock();
    for (auto recv_it=reviceList_.begin(); recv_it!=reviceList_.end(); ++recv_it) {
        int command = recv_it->first;
        const char* data_buf = recv_it->second;
        if (command==1000)
        {
            std::fstream fs;
            fs.open(data_buf,std::fstream::in | std::fstream::out | std::fstream::app);
            filename=data_buf;
            fs.close();
        }else if (command==1001){
            std::fstream fs;
            fs.open(filename.c_str(),std::fstream::out);
            fs<<data_buf;
            fs.flush();
            fs.close();
            
            rapidjson::Document d;
            d.Parse(data_buf);
            if(d.IsArray())
            {
                for (auto it = d.Begin(); it!=d.End(); ++it)
                {
                    rapidjson::Value &value = (*it);
                    if (value.IsObject() && value.HasMember("path") &&  value.HasMember("isDir"))
                    {
                        
                        const std::string &path =value["path"].GetString();
                        bool isDir =value["isDir"].GetBool();
                        fileList_[path] =isDir ;
                        this->getFileData(path,isDir);
                    }
                    
                }
            }
            
            
        }else if(command==1002){
            
            //read file name buffer size
            ssize_t filename_len=0;
            memcpy((&filename_len), data_buf, sizeof(int));
            //read file name string
            char *filename = new char[filename_len+1]();
            memset(filename, 0, filename_len+1);
            memcpy(filename, data_buf+sizeof(int), filename_len);
            //file content adderss
            const char *fileData =data_buf+sizeof(int)+filename_len+sizeof(int);
            //file content buffer size
            int len={0};
            memcpy(&len, data_buf+sizeof(int)+filename_len, 4);
            
            std::cout<<"update file:"<<filename<<std::endl;
            //write file to local
            std::ofstream out;
            out.open(filename,std::ios::binary);
            delete [] filename;
            filename = nullptr;
            out.write(fileData, len);
            out.flush();
            out.close();
            
        }
        
//        std::cout<<"command:"<<command<<" data:"<<data_buf<<std::endl;
        delete [] data_buf;
        data_buf=nullptr;
    }
    reviceList_.clear();
    revice_mtx.unlock();
    
}

void FileMonitorClient::loopReceiveFile()
{
    while(true)
    {
        close_mtx_.lock();
        if (close_) break;
        close_mtx_.unlock();
        
        //read command
        int command = 0;
        ssize_t recv_len=recv(sokt, &command, sizeof(int), 0);
        //read data length
        ssize_t data_size =0;
        recv_len = recv(sokt,(&data_size),sizeof(int),0);
        int er=errno;
        if(er>0)
        {
            std::cout<<strerror(er)<<std::endl;
        }
        if(!data_size) continue;
        
        std::cout<<"recvie packet length:"<<data_size<<std::endl;
        recv_len=0;
        char *buf=new char[data_size+1]{0};
        while (recv_len<data_size)
        {
            recv_len=recv(sokt, buf+recv_len, data_size-recv_len, 0);
            
        }
        std::string str(buf);
        revice_mtx.lock();
        reviceList_[command] = buf;
        revice_mtx.unlock();
    }
    
}
