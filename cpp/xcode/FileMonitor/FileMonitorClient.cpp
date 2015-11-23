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

FileMonitorClient* FileMonitorClient::_instance = nullptr;

#define MAX_BUFF_SIZE 4096
#define FILE_NAME_SIZE  512


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
        std::cout<<"服务器地址信息不正确,请重新确认后连接！"<<std::endl;
        return;
    }
    
    sokt = socket(servinfo->ai_family, servinfo->ai_socktype, servinfo->ai_protocol);
    if(sokt==-1)
    {
        std::cout<<"socket connect fail！"<<std::endl;
        freeaddrinfo(servinfo);
        return;
    }
    //    fcntl(sokt, F_SETFL,O_NONBLOCK);
    
    //    sem_t *my_sem;
    //    my_sem = sem_open("/myseml", O_CREAT,0664,0);
    //    sem_init(my_sem, 0, 1);
    
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
    const char buf[]="Hello";
    ssize_t len = strlen(buf);
    std::string command = "2000";
    this->sendData(command,buf, len);
    
}

void FileMonitorClient::sendData(std::string &command, const char *buf, ssize_t len)
{
//    char send_buf[1024]={0};
    std::string senddata("{");
    senddata.append("\"command\":\"");
    senddata.append(command);
    senddata.append("\",");
    senddata.append("\"data\":\"");
    senddata.append(buf);
    senddata.append("\"}");
    len = senddata.size();
//    memset(&send_buf, 0, 1024);
//    memcpy(&send_buf,senddata.c_str(),senddata.size());
//    memcpy(send_buf+command.size(),buf, len);
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
            std::cout<<("发送消息失败")<<strerror(err)<<std::endl;
            close_=false;
            break;
        }
    }
}

void FileMonitorClient::getFileData()
{
    
    std::fstream ifs;
    ifs.open(filename,std::ifstream::in);
    std::string data;
    while (getline(ifs,data)) {
//        std::cout<<data<<"data"<<std::endl;
        auto strit = data.find(".");
        if (strit==std::string::npos) {
            ssize_t pos=0;
            std::string parent_dir;
            while (pos!=std::string::npos) {
                pos=data.find("/");
                auto dirnane = data.substr(0,pos);
                data=data.substr(pos+1,data.size());
//                std::cout<<"create director:"<<dirnane<<std::endl;
                parent_dir.append(dirnane);
//                if (access(parent_dir.c_str(), R_OK | W_OK)==-1) {
                    int res= mkdir(parent_dir.c_str(),S_IRWXU);
                    if (res==-1) {
                        std::cout<<"mkdir"<<parent_dir<<" error"<<std::endl;
                    }
//                }
                parent_dir.append("/");

            }
        }else{
            std::string command("2002");
            char buf[1024]={0};
            memcpy(&buf, data.c_str(), data.length());
            sendData(command,buf,data.length());
        }
    }
    ifs.close();
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
            fs.close();
             std::cout<<"command:"<<command<<" data:"<<data_buf<<std::endl;
            this->getFileData();
            
        }else if(command==1002){
            
            char fileName[FILE_NAME_SIZE+1];
            ::memset((&fileName), 0, FILE_NAME_SIZE+1);
            ::memcpy((&fileName), data_buf, FILE_NAME_SIZE);
            
            //TODO image buffer 
            std::fstream fs;
            fs.open(fileName,std::fstream::out);
            const char *fileData =data_buf+FILE_NAME_SIZE;
            ssize_t len =strlen(fileData);//-FILE_NAME_SIZE;
            char dataBuf[6593];
            memset(&dataBuf, 0, 6593);
            memcpy((&dataBuf), fileData, 6593);
            fs<<dataBuf;
            fs.close();
            
            
        }
        
        std::cout<<"command:"<<command<<" data:"<<data_buf<<std::endl;
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
        //读取命令
        int command = 0;
        ssize_t recv_len=recv(sokt, &command, sizeof(int), 0);
        //读取数据长度
        ssize_t data_size =0;
        recv_len = recv(sokt,(&data_size),sizeof(int),0);
        int er=errno;
        if(er>0)
        {
            std::cout<<strerror(er)<<std::endl;
        }
        if(!data_size) continue;
        
        std::cout<<"接收到的包长度:"<<data_size<<std::endl;
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
//        delete [] buf;
    }
    
}
